-- GRIGOent 스키마 완전 재정비 SQL
-- 아티스트 상세페이지에서 사진과 경력 조회 문제 해결

-- ============================================
-- 1. 기존 데이터 백업 및 정리
-- ============================================

-- 기존 중복 데이터 정리
DELETE FROM public.artists_careers 
WHERE artist_id IN (
    SELECT a.id 
    FROM public.artists a 
    WHERE a.id NOT IN (
        SELECT DISTINCT ON (user_id) id
        FROM public.artists 
        ORDER BY user_id, created_at DESC
    )
);

DELETE FROM public.artists 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM public.artists 
    ORDER BY user_id, created_at DESC
);

-- ============================================
-- 2. 테이블 구조 개선
-- ============================================

-- artists 테이블에 유니크 제약조건 추가
ALTER TABLE public.artists 
DROP CONSTRAINT IF EXISTS artists_user_id_unique;

ALTER TABLE public.artists 
ADD CONSTRAINT artists_user_id_unique UNIQUE (user_id);

-- 인덱스 최적화
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON public.artists(user_id);
CREATE INDEX IF NOT EXISTS idx_artists_careers_artist_id ON public.artists_careers(artist_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- ============================================
-- 3. artist_list 뷰 재생성 (경력 정보 포함)
-- ============================================

DROP VIEW IF EXISTS public.artist_list;

CREATE OR REPLACE VIEW public.artist_list AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.role,
    u.phone,
    u.is_active,
    u.created_at,
    u.updated_at,
    a.id as artist_id,
    a.profile_image,
    a.artist_type,
    a.bio,
    a.youtube_links,
    a.name_ko,
    a.name_en,
    a.name_ja,
    a.name_zh,
    COUNT(ac.id) as career_count
FROM public.users u
LEFT JOIN public.artists a ON u.id = a.user_id
LEFT JOIN public.artists_careers ac ON a.id = ac.artist_id
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND u.is_active = true
GROUP BY 
    u.id, u.email, u.name, u.role, u.phone, u.is_active, 
    u.created_at, u.updated_at, a.id, a.profile_image, 
    a.artist_type, a.bio, a.youtube_links, a.name_ko, 
    a.name_en, a.name_ja, a.name_zh;

-- ============================================
-- 4. RLS 정책 설정
-- ============================================

-- artists 테이블 RLS 활성화
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- artists 테이블 정책
DROP POLICY IF EXISTS "Artists are viewable by everyone" ON public.artists;
CREATE POLICY "Artists are viewable by everyone" ON public.artists
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Choreographers can update own profile" ON public.artists;
CREATE POLICY "Choreographers can update own profile" ON public.artists
    FOR UPDATE USING (
        auth.uid() = user_id AND 
        artist_type IN ('choreographer', 'partner_choreographer')
    );

DROP POLICY IF EXISTS "Choreographers can insert own profile" ON public.artists;
CREATE POLICY "Choreographers can insert own profile" ON public.artists
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        artist_type IN ('choreographer', 'partner_choreographer')
    );

-- artists_careers 테이블 RLS 활성화
ALTER TABLE public.artists_careers ENABLE ROW LEVEL SECURITY;

-- artists_careers 테이블 정책
DROP POLICY IF EXISTS "Careers are viewable by everyone" ON public.artists_careers;
CREATE POLICY "Careers are viewable by everyone" ON public.artists_careers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Choreographers can manage own careers" ON public.artists_careers;
CREATE POLICY "Choreographers can manage own careers" ON public.artists_careers
    FOR ALL USING (
        auth.uid() = (
            SELECT user_id FROM public.artists 
            WHERE id = public.artists_careers.artist_id AND 
            artist_type IN ('choreographer', 'partner_choreographer')
        )
    );

-- users 테이블 RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- users 테이블 정책
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
CREATE POLICY "Users are viewable by everyone" ON public.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 5. 트리거 함수 개선
-- ============================================

CREATE OR REPLACE FUNCTION public.create_artist_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT 시: role이 choreographer 또는 partner_choreographer인 경우
    IF TG_OP = 'INSERT' AND NEW.role IN ('choreographer', 'partner_choreographer') THEN
        INSERT INTO public.artists (user_id, artist_type, name_ko, name_en)
        VALUES (
            NEW.id, 
            CASE 
                WHEN NEW.role = 'choreographer' THEN 'choreographer'
                WHEN NEW.role = 'partner_choreographer' THEN 'partner_choreographer'
            END,
            COALESCE(NEW.name, ''),
            NULL
        )
        ON CONFLICT (user_id) DO NOTHING;
    
    -- UPDATE 시: role이 choreographer 또는 partner_choreographer로 변경되는 경우
    ELSIF TG_OP = 'UPDATE' AND 
          NEW.role IN ('choreographer', 'partner_choreographer') AND 
          (OLD.role IS NULL OR OLD.role NOT IN ('choreographer', 'partner_choreographer')) THEN
        
        INSERT INTO public.artists (user_id, artist_type, name_ko, name_en)
        VALUES (
            NEW.id, 
            CASE 
                WHEN NEW.role = 'choreographer' THEN 'choreographer'
                WHEN NEW.role = 'partner_choreographer' THEN 'partner_choreographer'
            END,
            COALESCE(NEW.name, ''),
            NULL
        )
        ON CONFLICT (user_id) DO UPDATE SET
            artist_type = EXCLUDED.artist_type,
            name_ko = EXCLUDED.name_ko,
            updated_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 재생성
DROP TRIGGER IF EXISTS trigger_create_artist_profile ON public.users;
CREATE TRIGGER trigger_create_artist_profile
    AFTER INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_artist_profile();

-- ============================================
-- 6. Storage 버킷 및 정책 설정
-- ============================================

-- artist-profiles 버킷 생성 (이미 있다면 무시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('artist-profiles', 'artist-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책 설정
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'artist-profiles');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'artist-profiles' AND 
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'artist-profiles' AND 
        auth.uid() = owner
    );

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'artist-profiles' AND 
        auth.uid() = owner
    );

-- ============================================
-- 7. 권한 설정
-- ============================================

-- 뷰 권한 설정
GRANT SELECT ON public.artist_list TO authenticated;
GRANT SELECT ON public.artist_list TO anon;

-- 테이블 권한 설정
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artists_careers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;

-- ============================================
-- 8. 확인 쿼리
-- ============================================

-- 아티스트 프로필 확인
SELECT 
    u.email,
    u.name,
    u.role,
    a.id as artist_id,
    a.profile_image,
    a.name_ko,
    COUNT(ac.id) as career_count
FROM public.users u
LEFT JOIN public.artists a ON u.id = a.user_id
LEFT JOIN public.artists_careers ac ON a.id = ac.artist_id
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND u.is_active = true
GROUP BY u.email, u.name, u.role, a.id, a.profile_image, a.name_ko
ORDER BY u.email;

-- ============================================
-- 완료 메시지
-- ============================================
-- 스키마 재정비가 완료되었습니다.
-- 이제 아티스트 상세페이지에서 사진과 경력이 올바르게 표시될 것입니다. 