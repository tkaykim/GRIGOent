-- 트리거 자동화 문제 해결 SQL
-- 승인 후 자동으로 아티스트 프로필 생성되도록 개선

-- ============================================
-- 1. 현재 트리거 상태 확인
-- ============================================

-- 현재 트리거 확인
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'public'
ORDER BY trigger_name;

-- ============================================
-- 2. 트리거 함수 완전 재작성
-- ============================================

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS trigger_create_artist_profile ON public.users;

-- 트리거 함수 완전 재작성
CREATE OR REPLACE FUNCTION public.create_artist_profile()
RETURNS TRIGGER AS $$
DECLARE
    existing_artist_id uuid;
BEGIN
    -- 디버깅을 위한 로그 (Supabase에서는 작동하지 않지만 주석으로 남김)
    -- RAISE NOTICE 'Trigger called: TG_OP=%, NEW.role=%, OLD.role=%', TG_OP, NEW.role, OLD.role;
    
    -- INSERT 시: role이 choreographer 또는 partner_choreographer인 경우
    IF TG_OP = 'INSERT' AND NEW.role IN ('choreographer', 'partner_choreographer') THEN
        -- 기존 아티스트 프로필이 있는지 확인
        SELECT id INTO existing_artist_id 
        FROM public.artists 
        WHERE user_id = NEW.id;
        
        -- 없으면 생성
        IF existing_artist_id IS NULL THEN
            INSERT INTO public.artists (user_id, artist_type, name_ko, name_en)
            VALUES (
                NEW.id, 
                CASE 
                    WHEN NEW.role = 'choreographer' THEN 'choreographer'
                    WHEN NEW.role = 'partner_choreographer' THEN 'partner_choreographer'
                END,
                COALESCE(NEW.name, ''),
                NULL
            );
        END IF;
    
    -- UPDATE 시: role이 choreographer 또는 partner_choreographer로 변경되는 경우
    ELSIF TG_OP = 'UPDATE' AND 
          NEW.role IN ('choreographer', 'partner_choreographer') AND 
          (OLD.role IS NULL OR OLD.role NOT IN ('choreographer', 'partner_choreographer')) THEN
        
        -- 기존 아티스트 프로필이 있는지 확인
        SELECT id INTO existing_artist_id 
        FROM public.artists 
        WHERE user_id = NEW.id;
        
        -- 없으면 생성, 있으면 업데이트
        IF existing_artist_id IS NULL THEN
            INSERT INTO public.artists (user_id, artist_type, name_ko, name_en)
            VALUES (
                NEW.id, 
                CASE 
                    WHEN NEW.role = 'choreographer' THEN 'choreographer'
                    WHEN NEW.role = 'partner_choreographer' THEN 'partner_choreographer'
                END,
                COALESCE(NEW.name, ''),
                NULL
            );
        ELSE
            UPDATE public.artists 
            SET 
                artist_type = CASE 
                    WHEN NEW.role = 'choreographer' THEN 'choreographer'
                    WHEN NEW.role = 'partner_choreographer' THEN 'partner_choreographer'
                END,
                name_ko = COALESCE(NEW.name, ''),
                updated_at = now()
            WHERE user_id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. 트리거 재생성 (더 명확한 설정)
-- ============================================

CREATE TRIGGER trigger_create_artist_profile
    AFTER INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_artist_profile();

-- ============================================
-- 4. 트리거 테스트
-- ============================================

-- 테스트용 사용자 생성 (실제로는 실행하지 않음)
-- INSERT INTO public.users (id, email, name, role, pending_role) 
-- VALUES (gen_random_uuid(), 'test@example.com', 'Test User', 'choreographer', null);

-- ============================================
-- 5. 기존 사용자들의 아티스트 프로필 확인 및 생성
-- ============================================

-- 아티스트 프로필이 없는 choreographer/partner_choreographer 확인
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    a.id as artist_id
FROM public.users u
LEFT JOIN public.artists a ON u.id = a.user_id
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND u.is_active = true
  AND a.id IS NULL
ORDER BY u.created_at DESC;

-- 누락된 아티스트 프로필 생성
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
  AND u.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.artists a WHERE a.user_id = u.id
  );

-- ============================================
-- 6. 최종 확인
-- ============================================

-- 모든 choreographer/partner_choreographer와 아티스트 프로필 매칭 확인
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.pending_role,
    a.id as artist_id,
    a.artist_type,
    a.name_ko,
    a.created_at as artist_created_at
FROM public.users u
LEFT JOIN public.artists a ON u.id = a.user_id
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND u.is_active = true
ORDER BY u.created_at DESC;

-- ============================================
-- 완료 메시지
-- ============================================
-- 트리거가 완전히 재작성되었습니다.
-- 이제 승인 시 자동으로 아티스트 프로필이 생성될 것입니다. 