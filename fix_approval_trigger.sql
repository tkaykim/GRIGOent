-- 승인 후 권한 변경 문제 해결 SQL
-- 트리거 함수 수정 및 확인

-- ============================================
-- 1. 현재 트리거 상태 확인
-- ============================================

-- 현재 트리거 확인
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'public'
ORDER BY trigger_name;

-- ============================================
-- 2. 트리거 함수 개선
-- ============================================

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS trigger_create_artist_profile ON public.users;

-- 트리거 함수 수정 (INSERT와 UPDATE 모두 처리)
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

-- ============================================
-- 3. 트리거 재생성 (INSERT와 UPDATE 모두 처리)
-- ============================================

CREATE TRIGGER trigger_create_artist_profile
    AFTER INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_artist_profile();

-- ============================================
-- 4. 테스트용 사용자 확인
-- ============================================

-- 승인 대기 중인 사용자 확인
SELECT 
    id,
    email,
    name,
    role,
    pending_role,
    is_active,
    created_at
FROM public.users 
WHERE pending_role IS NOT NULL 
  AND pending_role != role
ORDER BY created_at DESC;

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

-- ============================================
-- 5. 수동으로 아티스트 프로필 생성 (필요한 경우)
-- ============================================

-- 아티스트 프로필이 없는 사용자들을 위한 프로필 생성
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
    a.name_ko
FROM public.users u
LEFT JOIN public.artists a ON u.id = a.user_id
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND u.is_active = true
ORDER BY u.created_at DESC;

-- ============================================
-- 완료 메시지
-- ============================================
-- 트리거가 INSERT와 UPDATE 모두 처리하도록 수정되었습니다.
-- 이제 승인 후 권한 변경이 정상적으로 작동할 것입니다. 