-- 경력 데이터 연결 수정 SQL
-- 이 스크립트는 경력 데이터가 올바른 아티스트 프로필에 연결되도록 수정합니다.

-- ============================================
-- 1. 현재 경력 데이터 상황 확인
-- ============================================

-- 모든 경력 데이터와 연결된 아티스트 정보 확인
SELECT 
    ac.id as career_id,
    ac.artist_id,
    ac.title,
    ac.type,
    a.user_id,
    u.name,
    u.email,
    a.name_ko as artist_name
FROM public.artists_careers ac
LEFT JOIN public.artists a ON ac.artist_id = a.id
LEFT JOIN public.users u ON a.user_id = u.id
ORDER BY u.email, ac.created_at DESC;

-- ============================================
-- 2. 경력 데이터가 없는 아티스트 확인
-- ============================================

-- 아티스트 프로필은 있지만 경력 데이터가 없는 경우
SELECT 
    a.id as artist_id,
    a.user_id,
    u.name,
    u.email,
    a.name_ko
FROM public.artists a
JOIN public.users u ON a.user_id = u.id
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND u.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.artists_careers ac WHERE ac.artist_id = a.id
  );

-- ============================================
-- 3. 경력 데이터를 올바른 아티스트 프로필로 재연결
-- ============================================

-- 레난(renan@grigoent.co.kr) 사용자의 경력 데이터 재연결
UPDATE public.artists_careers 
SET artist_id = (
    SELECT a.id 
    FROM public.artists a 
    JOIN public.users u ON a.user_id = u.id 
    WHERE u.email = 'renan@grigoent.co.kr'
    LIMIT 1
)
WHERE artist_id IN (
    SELECT a.id 
    FROM public.artists a 
    JOIN public.users u ON a.user_id = u.id 
    WHERE u.email = 'renan@grigoent.co.kr'
    AND a.id != (
        SELECT a2.id 
        FROM public.artists a2 
        JOIN public.users u2 ON a2.user_id = u2.id 
        WHERE u2.email = 'renan@grigoent.co.kr'
        ORDER BY a2.created_at DESC
        LIMIT 1
    )
);

-- ============================================
-- 4. 다른 사용자들의 경력 데이터도 확인 및 수정
-- ============================================

-- 모든 choreographer/partner_choreographer 사용자에 대해 경력 데이터 재연결
DO $$
DECLARE
    user_record RECORD;
    correct_artist_id UUID;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT u.id, u.email, u.name
        FROM public.users u
        WHERE u.role IN ('choreographer', 'partner_choreographer')
          AND u.is_active = true
    LOOP
        -- 각 사용자의 가장 최신 아티스트 프로필 ID 찾기
        SELECT a.id INTO correct_artist_id
        FROM public.artists a
        WHERE a.user_id = user_record.id
        ORDER BY a.created_at DESC
        LIMIT 1;
        
        -- 해당 사용자의 모든 경력 데이터를 올바른 아티스트 프로필로 연결
        IF correct_artist_id IS NOT NULL THEN
            UPDATE public.artists_careers 
            SET artist_id = correct_artist_id
            WHERE artist_id IN (
                SELECT a.id 
                FROM public.artists a 
                WHERE a.user_id = user_record.id
                AND a.id != correct_artist_id
            );
        END IF;
    END LOOP;
END $$;

-- ============================================
-- 5. 수정 후 확인
-- ============================================

-- 수정 후 경력 데이터 연결 상태 확인
SELECT 
    u.email,
    u.name,
    a.id as artist_id,
    COUNT(ac.id) as career_count,
    array_agg(ac.title) as career_titles
FROM public.users u
JOIN public.artists a ON u.id = a.user_id
LEFT JOIN public.artists_careers ac ON a.id = ac.artist_id
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND u.is_active = true
GROUP BY u.email, u.name, a.id
ORDER BY u.email;

-- ============================================
-- 완료 메시지
-- ============================================
-- 경력 데이터 연결 수정이 완료되었습니다.
-- 이제 아티스트 상세페이지에서 경력사항이 올바르게 표시될 것입니다. 