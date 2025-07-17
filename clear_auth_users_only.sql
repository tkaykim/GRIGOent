-- auth.users 테이블 사용자 계정 삭제 SQL
-- 애플리케이션 데이터는 유지하고 인증 계정만 삭제

-- ============================================
-- 주의사항: 이 스크립트는 모든 사용자 계정을 삭제합니다!
-- 실행 전 반드시 백업을 확인하세요.
-- ============================================

-- 1. auth.sessions 테이블 데이터 삭제 (세션 정보)
DELETE FROM auth.sessions;

-- 2. auth.identities 테이블 데이터 삭제 (소셜 로그인 정보)
DELETE FROM auth.identities;

-- 3. auth.flow_state 테이블 데이터 삭제 (인증 플로우 상태)
DELETE FROM auth.flow_state;

-- 4. auth.users 테이블 데이터 삭제 (사용자 계정)
DELETE FROM auth.users;

-- ============================================
-- 삭제 확인 쿼리
-- ============================================

-- 삭제 후 데이터 확인
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'auth.sessions', COUNT(*) FROM auth.sessions
UNION ALL
SELECT 'auth.identities', COUNT(*) FROM auth.identities
UNION ALL
SELECT 'auth.flow_state', COUNT(*) FROM auth.flow_state;

-- ============================================
-- 완료 메시지
-- ============================================
-- 모든 사용자 계정이 삭제되었습니다.
-- 이제 새로운 회원가입부터 테스트를 진행할 수 있습니다. 