-- GRIGOent 모든 사용자 데이터 삭제 SQL
-- auth.users와 public.users 모두 삭제

-- ============================================
-- 주의사항: 이 스크립트는 모든 사용자 계정을 삭제합니다!
-- 실행 전 반드시 백업을 확인하세요.
-- ============================================

-- 1. auth 관련 테이블 데이터 삭제
DELETE FROM auth.sessions;
DELETE FROM auth.identities;
DELETE FROM auth.flow_state;
DELETE FROM auth.users;

-- 2. public 관련 테이블 데이터 삭제
DELETE FROM public.artists_careers;
DELETE FROM public.artists;
DELETE FROM public.users;
DELETE FROM public.inquiries;

-- ============================================
-- 삭제 확인 쿼리
-- ============================================

-- 삭제 후 데이터 확인
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'public.users', COUNT(*) FROM public.users
UNION ALL
SELECT 'public.artists', COUNT(*) FROM public.artists
UNION ALL
SELECT 'public.artists_careers', COUNT(*) FROM public.artists_careers
UNION ALL
SELECT 'public.inquiries', COUNT(*) FROM public.inquiries;

-- ============================================
-- 완료 메시지
-- ============================================
-- 모든 사용자 데이터가 삭제되었습니다.
-- 이제 새로운 회원가입부터 테스트를 진행할 수 있습니다. 