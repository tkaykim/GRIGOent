-- GRIGOent 데이터베이스 모든 데이터 삭제 SQL
-- 스키마 구조는 유지하고 데이터만 삭제

-- ============================================
-- 주의사항: 이 스크립트는 모든 데이터를 삭제합니다!
-- 실행 전 반드시 백업을 확인하세요.
-- ============================================

-- 1. 문의 데이터 삭제
DELETE FROM public.inquiries;

-- 2. 아티스트 대표작 데이터 삭제
DELETE FROM public.artist_featured_works;

-- 3. 아티스트 경력 데이터 삭제
DELETE FROM public.artists_careers;

-- 4. 아티스트 프로필 데이터 삭제
DELETE FROM public.artists;

-- 5. 팀 데이터 삭제
DELETE FROM public.teams;

-- 6. 사용자 데이터 삭제 (auth.users는 제외)
DELETE FROM public.users;

-- 7. 문의 타입 데이터 삭제 (기본 데이터는 다시 삽입됨)
DELETE FROM public.inquiry_types;

-- 8. 역할 데이터 삭제 (기본 데이터는 다시 삽입됨)
DELETE FROM public.roles;

-- 9. 통화 데이터 삭제 (기본 데이터는 다시 삽입됨)
DELETE FROM public.currencies;

-- ============================================
-- 기본 데이터 재삽입
-- ============================================

-- 역할 데이터 재삽입
INSERT INTO public.roles (name) VALUES 
('client'),
('choreographer'),
('partner_choreographer'),
('admin')
ON CONFLICT DO NOTHING;

-- 통화 데이터 재삽입
INSERT INTO public.currencies (code, name) VALUES 
('KRW', '원'),
('USD', '달러'),
('EUR', '유로'),
('JPY', '엔')
ON CONFLICT DO NOTHING;

-- 문의 타입 데이터 재삽입
INSERT INTO public.inquiry_types (name) VALUES 
('안무제작'),
('댄서섭외'),
('공연출연'),
('워크샵'),
('기타')
ON CONFLICT DO NOTHING;

-- ============================================
-- 시퀀스 리셋 (필요한 경우)
-- ============================================

-- inquiry_types 시퀀스 리셋
ALTER SEQUENCE public.inquiry_types_id_seq RESTART WITH 1;

-- roles 시퀀스 리셋
ALTER SEQUENCE public.roles_id_seq RESTART WITH 1;

-- currencies 시퀀스 리셋
ALTER SEQUENCE public.currencies_id_seq RESTART WITH 1;

-- ============================================
-- 삭제 확인 쿼리
-- ============================================

-- 삭제 후 데이터 확인
SELECT 'inquiries' as table_name, COUNT(*) as count FROM public.inquiries
UNION ALL
SELECT 'artist_featured_works', COUNT(*) FROM public.artist_featured_works
UNION ALL
SELECT 'artists_careers', COUNT(*) FROM public.artists_careers
UNION ALL
SELECT 'artists', COUNT(*) FROM public.artists
UNION ALL
SELECT 'teams', COUNT(*) FROM public.teams
UNION ALL
SELECT 'users', COUNT(*) FROM public.users
UNION ALL
SELECT 'inquiry_types', COUNT(*) FROM public.inquiry_types
UNION ALL
SELECT 'roles', COUNT(*) FROM public.roles
UNION ALL
SELECT 'currencies', COUNT(*) FROM public.currencies;

-- ============================================
-- 완료 메시지
-- ============================================
-- 모든 데이터가 삭제되었습니다.
-- 이제 새로운 회원가입부터 테스트를 진행할 수 있습니다. 