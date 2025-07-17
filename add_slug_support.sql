-- URL 친화적인 slug 지원 추가
-- 복잡한 UUID 대신 영어 이름 기반 URL 사용

-- ============================================
-- 1. users 테이블에 slug 필드 추가
-- ============================================

-- slug 필드 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS slug text;

-- slug에 유니크 인덱스 추가
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_slug ON public.users(slug) WHERE slug IS NOT NULL;

-- ============================================
-- 2. slug 생성 함수
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_slug(input_name text, user_id uuid DEFAULT NULL)
RETURNS text AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
    existing_count integer;
BEGIN
    -- 기본 slug 생성 (영어, 숫자만 허용, 공백을 하이픈으로 변경)
    base_slug := lower(regexp_replace(input_name, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- 빈 문자열이면 기본값 사용
    IF base_slug = '' THEN
        base_slug := 'user';
    END IF;
    
    final_slug := base_slug;
    
    -- 중복 확인 및 번호 추가
    LOOP
        -- 현재 slug가 이미 존재하는지 확인 (자신 제외)
        SELECT COUNT(*) INTO existing_count
        FROM public.users 
        WHERE slug = final_slug 
        AND (user_id IS NULL OR id != user_id);
        
        -- 중복이 없으면 반환
        IF existing_count = 0 THEN
            RETURN final_slug;
        END IF;
        
        -- 중복이 있으면 번호 추가
        counter := counter + 1;
        final_slug := base_slug || '-' || counter::text;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. 기존 사용자들의 slug 생성
-- ============================================

-- 기존 사용자들에게 slug 생성
UPDATE public.users 
SET slug = public.generate_slug(COALESCE(name, email), id)
WHERE slug IS NULL;

-- ============================================
-- 4. 트리거 함수 수정 (새 사용자 자동 slug 생성)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, phone, is_active, pending_role, slug)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'general',
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    true,
    COALESCE(NEW.raw_user_meta_data->>'pending_role', null),
    public.generate_slug(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. 아티스트 상세페이지용 뷰 생성
-- ============================================

CREATE OR REPLACE VIEW public.artist_detail_view AS
SELECT 
    u.id,
    u.slug,
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
    u.id, u.slug, u.email, u.name, u.role, u.phone, u.is_active, 
    u.created_at, u.updated_at, a.id, a.profile_image, 
    a.artist_type, a.bio, a.youtube_links, a.name_ko, 
    a.name_en, a.name_ja, a.name_zh;

-- ============================================
-- 6. 뷰 권한 설정
-- ============================================

GRANT SELECT ON public.artist_detail_view TO authenticated;
GRANT SELECT ON public.artist_detail_view TO anon;

-- ============================================
-- 7. 확인 쿼리
-- ============================================

-- slug가 생성된 사용자들 확인
SELECT 
    id,
    name,
    email,
    slug,
    role
FROM public.users 
WHERE slug IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 완료 메시지
-- ============================================
-- slug 지원이 추가되었습니다.
-- 이제 /artists/john-doe 같은 URL을 사용할 수 있습니다. 