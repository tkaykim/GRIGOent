-- GRIGOent 회원정보, 아티스트, 커리어 데이터 삭제 SQL
-- 기본 마스터 데이터는 유지하고 사용자 관련 데이터만 삭제

-- ============================================
-- 주의사항: 이 스크립트는 사용자 관련 데이터를 삭제합니다!
-- 실행 전 반드시 백업을 확인하세요.
-- ============================================

-- 1. 아티스트 경력 데이터 삭제
DELETE FROM public.artists_careers;

-- 2. 아티스트 프로필 데이터 삭제
DELETE FROM public.artists;

-- 3. 사용자 데이터 삭제 (auth.users는 제외)
DELETE FROM public.users;

-- 4. 문의 데이터 삭제 (사용자 관련)
DELETE FROM public.inquiries;

-- ============================================
-- 삭제 확인 쿼리
-- ============================================

-- 삭제 후 데이터 확인
SELECT 'artists_careers' as table_name, COUNT(*) as count FROM public.artists_careers
UNION ALL
SELECT 'artists', COUNT(*) FROM public.artists
UNION ALL
SELECT 'users', COUNT(*) FROM public.users
UNION ALL
SELECT 'inquiries', COUNT(*) FROM public.inquiries;

-- ============================================
-- 완료 메시지
-- ============================================
-- 회원정보, 아티스트, 커리어 관련 데이터가 모두 삭제되었습니다.
-- 이제 새로운 회원가입부터 테스트를 진행할 수 있습니다. 