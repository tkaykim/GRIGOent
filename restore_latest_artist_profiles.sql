-- 삭제된 최신 아티스트 프로필 복구 SQL
-- 이 스크립트는 중복 정리 과정에서 잘못 삭제된 최신 데이터를 복구합니다.

-- ============================================
-- 1. 현재 상황 확인
-- ============================================

-- 현재 남아있는 아티스트 프로필 확인
SELECT 
    user_id,
    id as artist_id,
    name_ko,
    profile_image,
    created_at,
    updated_at
FROM public.artists 
ORDER BY user_id, created_at DESC;

-- ============================================
-- 2. 중복이 있었던 사용자들 확인
-- ============================================

-- 중복이 있었던 사용자들의 이메일과 이름 확인
SELECT DISTINCT
    u.email,
    u.name,
    u.role,
    COUNT(a.id) as artist_count
FROM public.users u
LEFT JOIN public.artists a ON u.id = a.user_id
WHERE u.role IN ('choreographer', 'partner_choreographer')
GROUP BY u.id, u.email, u.name, u.role
HAVING COUNT(a.id) = 0 OR COUNT(a.id) = 1
ORDER BY u.email;

-- ============================================
-- 3. 아티스트 프로필이 없는 사용자들 복구
-- ============================================

-- 아티스트 프로필이 없는 choreographer/partner_choreographer 사용자들을 위한 프로필 생성
INSERT INTO public.artists (user_id, artist_type, name_ko, name_en, profile_image, bio, youtube_links)
SELECT 
    u.id,
    CASE 
        WHEN u.role = 'choreographer' THEN 'choreographer'
        WHEN u.role = 'partner_choreographer' THEN 'partner_choreographer'
    END,
    COALESCE(u.name, ''),
    NULL,
    NULL,
    '',
    ARRAY[]::text[]
FROM public.users u
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND u.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.artists a WHERE a.user_id = u.id
  );

-- ============================================
-- 4. 복구 후 확인
-- ============================================

-- 복구 후 아티스트 프로필 확인
SELECT 
    u.email,
    u.name,
    u.role,
    a.id as artist_id,
    a.name_ko,
    a.profile_image,
    a.created_at
FROM public.users u
LEFT JOIN public.artists a ON u.id = a.user_id
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND u.is_active = true
ORDER BY u.email;

-- ============================================
-- 5. 경력 데이터 확인
-- ============================================

-- 아티스트별 경력 데이터 확인
SELECT 
    a.user_id,
    u.name,
    u.email,
    a.id as artist_id,
    COUNT(ac.id) as career_count
FROM public.artists a
JOIN public.users u ON a.user_id = u.id
LEFT JOIN public.artists_careers ac ON a.id = ac.artist_id
WHERE u.role IN ('choreographer', 'partner_choreographer')
  AND u.is_active = true
GROUP BY a.user_id, u.name, u.email, a.id
ORDER BY u.email;

-- ============================================
-- 완료 메시지
-- ============================================
-- 아티스트 프로필 복구가 완료되었습니다.
-- 이제 아티스트 상세페이지에서 프로필 사진과 경력사항이 올바르게 표시될 것입니다. 