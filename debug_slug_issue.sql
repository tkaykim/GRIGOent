-- Slug 문제 진단 및 해결 SQL

-- ============================================
-- 1. 현재 상황 확인
-- ============================================

-- users 테이블의 slug 상태 확인
SELECT 
    id,
    name,
    email,
    slug,
    role,
    created_at
FROM public.users 
WHERE slug IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- slug가 없는 사용자 확인
SELECT 
    id,
    name,
    email,
    slug,
    role,
    created_at
FROM public.users 
WHERE slug IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 2. 아티스트와 사용자 연결 확인
-- ============================================

-- 아티스트 프로필과 사용자 연결 상태
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.slug,
    u.role,
    a.id as artist_id,
    a.artist_type,
    a.name_ko
FROM public.users u
LEFT JOIN public.artists a ON u.id = a.user_id
WHERE u.role IN ('choreographer', 'partner_choreographer')
ORDER BY u.created_at DESC;

-- ============================================
-- 3. slug 재생성 (더 나은 방식)
-- ============================================

-- 기존 slug 초기화
UPDATE public.users SET slug = NULL;

-- 더 나은 slug 생성 함수
CREATE OR REPLACE FUNCTION public.generate_better_slug(input_name text, user_id uuid DEFAULT NULL)
RETURNS text AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
    existing_count integer;
BEGIN
    -- 이름이 없으면 이메일 사용
    IF input_name IS NULL OR input_name = '' THEN
        input_name := 'user';
    END IF;
    
    -- 기본 slug 생성 (영어, 숫자만 허용, 공백을 하이픈으로 변경)
    base_slug := lower(regexp_replace(input_name, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- 빈 문자열이면 기본값 사용
    IF base_slug = '' OR base_slug IS NULL THEN
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
-- 4. 모든 사용자에게 slug 생성
-- ============================================

-- choreographer와 partner_choreographer에게 우선적으로 slug 생성
UPDATE public.users 
SET slug = public.generate_better_slug(COALESCE(name, email), id)
WHERE role IN ('choreographer', 'partner_choreographer')
  AND slug IS NULL;

-- 나머지 사용자들에게도 slug 생성
UPDATE public.users 
SET slug = public.generate_better_slug(COALESCE(name, email), id)
WHERE slug IS NULL;

-- ============================================
-- 5. 트리거 함수 수정
-- ============================================

-- 트리거 함수 수정 (더 나은 slug 생성)
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
    public.generate_better_slug(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 아티스트 상세페이지용 뷰 수정
-- ============================================

-- 더 나은 아티스트 상세 뷰 생성
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
  AND u.slug IS NOT NULL
GROUP BY 
    u.id, u.slug, u.email, u.name, u.role, u.phone, u.is_active, 
    u.created_at, u.updated_at, a.id, a.profile_image, 
    a.artist_type, a.bio, a.youtube_links, a.name_ko, 
    a.name_en, a.name_ja, a.name_zh;

-- ============================================
-- 7. 최종 확인
-- ============================================

-- slug가 생성된 아티스트들 확인
SELECT 
    u.id,
    u.name,
    u.slug,
    u.role,
    a.id as artist_id,
    a.artist_type,
    a.name_ko
FROM public.users u
LEFT JOIN public.artists a ON u.id = a.user_id
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND u.slug IS NOT NULL
ORDER BY u.created_at DESC;

-- ============================================
-- 완료 메시지
-- ============================================
-- slug 문제가 해결되었습니다.
-- 이제 더 나은 slug가 생성되고 아티스트 데이터와 제대로 연동됩니다. 