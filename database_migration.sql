-- GRIGOent 데이터베이스 마이그레이션
-- users 테이블에 pending_role 필드 추가 및 아티스트 연결

-- 1. users 테이블에 pending_role 필드 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS pending_role text;

-- 2. users 테이블의 role 기본값을 'general'로 변경
ALTER TABLE public.users 
ALTER COLUMN role SET DEFAULT 'general';

-- 3. 기존 role이 'client'인 사용자들을 'general'로 변경 (필요한 경우)
-- UPDATE public.users SET role = 'general' WHERE role = 'client';

-- 4. artists 테이블에 user_id가 없는 경우를 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON public.artists(user_id);

-- 5. artists_careers 테이블 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_artists_careers_artist_id ON public.artists_careers(artist_id);

-- 6. RLS (Row Level Security) 정책 추가
-- 전속안무가와 파트너댄서는 자신의 아티스트 프로필만 수정 가능
CREATE POLICY IF NOT EXISTS "Choreographers can update own artist profile" ON public.artists
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    artist_type IN ('choreographer', 'partner_choreographer')
  );

-- 전속안무가와 파트너댄서는 자신의 경력만 관리 가능
CREATE POLICY IF NOT EXISTS "Choreographers can manage own careers" ON public.artists_careers
  FOR ALL USING (
    auth.uid() = (
      SELECT user_id FROM public.artists 
      WHERE id = public.artists_careers.artist_id AND 
      artist_type IN ('choreographer', 'partner_choreographer')
    )
  );

-- 전속안무가와 파트너댄서는 자신의 대표작만 관리 가능
CREATE POLICY IF NOT EXISTS "Choreographers can manage own featured works" ON public.artist_featured_works
  FOR ALL USING (
    auth.uid() = (
      SELECT user_id FROM public.artists 
      WHERE id = public.artist_featured_works.artist_id AND 
      artist_type IN ('choreographer', 'partner_choreographer')
    )
  );

-- 7. 뷰 생성 (아티스트 목록 조회용)
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
    a.name_zh
FROM public.users u
LEFT JOIN public.artists a ON u.id = a.user_id
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND u.is_active = true;

-- 8. 트리거 함수 생성 (새로운 choreographer/partner_choreographer 회원 가입 시 자동으로 artists 테이블에 레코드 생성)
CREATE OR REPLACE FUNCTION public.create_artist_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- role이 choreographer 또는 partner_choreographer로 변경될 때
    IF NEW.role IN ('choreographer', 'partner_choreographer') AND 
       (OLD.role IS NULL OR OLD.role NOT IN ('choreographer', 'partner_choreographer')) THEN
        
        -- artists 테이블에 해당 user_id로 레코드가 없으면 생성
        INSERT INTO public.artists (user_id, artist_type, name_ko, name_en)
        SELECT 
            NEW.id, 
            CASE 
                WHEN NEW.role = 'choreographer' THEN 'choreographer'
                WHEN NEW.role = 'partner_choreographer' THEN 'partner_choreographer'
            END,
            COALESCE(NEW.name, ''),
            NULL
        WHERE NOT EXISTS (
            SELECT 1 FROM public.artists WHERE user_id = NEW.id
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. 트리거 생성
DROP TRIGGER IF EXISTS trigger_create_artist_profile ON public.users;
CREATE TRIGGER trigger_create_artist_profile
    AFTER UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_artist_profile();

-- 10. 기존 choreographer/partner_choreographer 회원들을 위한 artists 레코드 생성
INSERT INTO public.artists (user_id, artist_type, name_ko, name_en)
SELECT 
    u.id,
    CASE 
        WHEN u.role = 'choreographer' THEN 'choreographer'
        WHEN u.role = 'partner_choreographer' THEN 'partner_choreographer'
    END,
    COALESCE(u.name, ''),
    NULL
FROM public.users u
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND NOT EXISTS (
    SELECT 1 FROM public.artists a WHERE a.user_id = u.id
  );

-- 11. 인덱스 최적화
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_pending_role ON public.users(pending_role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- 12. 뷰 권한 설정
GRANT SELECT ON public.artist_list TO authenticated;
GRANT SELECT ON public.artist_list TO anon; 