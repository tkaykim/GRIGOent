-- 승인 오류 해결을 위한 SQL 스크립트

-- 1. 트리거 비활성화 (임시)
DROP TRIGGER IF EXISTS trigger_create_artist_profile ON public.users;

-- 2. 트리거 함수 수정 (ON CONFLICT 제거)
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

-- 3. 트리거 재생성
CREATE TRIGGER trigger_create_artist_profile
    AFTER UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_artist_profile();

-- 4. artists 테이블에 user_id 유니크 제약조건 추가 (선택사항)
-- ALTER TABLE public.artists ADD CONSTRAINT unique_artist_user_id UNIQUE (user_id); 