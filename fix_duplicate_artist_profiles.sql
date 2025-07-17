-- 중복 아티스트 프로필 문제 해결 SQL
-- 1. 기존 중복 레코드 정리
-- 2. 트리거 함수 개선
-- 3. 유니크 제약 조건 추가

-- ============================================
-- 1. 기존 중복 레코드 정리
-- ============================================

-- 중복된 아티스트 프로필 중 가장 최신 것만 남기고 나머지 삭제
DELETE FROM public.artists 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.artists 
  ORDER BY user_id, created_at DESC
);

-- ============================================
-- 2. user_id에 유니크 제약 조건 추가
-- ============================================

-- 기존 인덱스 삭제 (있다면)
DROP INDEX IF EXISTS idx_artists_user_id;

-- 유니크 제약 조건 추가
ALTER TABLE public.artists 
ADD CONSTRAINT artists_user_id_unique UNIQUE (user_id);

-- 인덱스 재생성
CREATE INDEX idx_artists_user_id ON public.artists(user_id);

-- ============================================
-- 3. 트리거 함수 개선 (INSERT와 UPDATE 모두 처리)
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

-- ============================================
-- 4. 트리거 재생성 (INSERT와 UPDATE 모두 처리)
-- ============================================

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS trigger_create_artist_profile ON public.users;

-- 새로운 트리거 생성 (INSERT와 UPDATE 모두 처리)
CREATE TRIGGER trigger_create_artist_profile
    AFTER INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_artist_profile();

-- ============================================
-- 5. 확인 쿼리
-- ============================================

-- 중복 확인
SELECT 
    user_id, 
    COUNT(*) as count,
    string_agg(id::text, ', ') as artist_ids
FROM public.artists 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- 아티스트 프로필이 없는 choreographer/partner_choreographer 확인
SELECT 
    u.id,
    u.name,
    u.email,
    u.role
FROM public.users u
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND u.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.artists a WHERE a.user_id = u.id
  );

-- ============================================
-- 완료 메시지
-- ============================================
-- 중복 아티스트 프로필 문제가 해결되었습니다.
-- 이제 회원가입 시 중복 레코드가 생성되지 않습니다. 