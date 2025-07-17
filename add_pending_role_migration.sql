-- users 테이블 pending_role 컬럼 추가 및 role 기본값 변경 마이그레이션

-- ============================================
-- 1. pending_role 컬럼 추가
-- ============================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS pending_role text;

-- ============================================
-- 2. role 기본값을 'general'로 변경
-- ============================================
ALTER TABLE public.users 
ALTER COLUMN role SET DEFAULT 'general';

-- ============================================
-- 3. 기존 데이터 중 role이 'client'인 것을 'general'로 변경
-- ============================================
UPDATE public.users 
SET role = 'general' 
WHERE role = 'client';

-- ============================================
-- 4. 확인 쿼리
-- ============================================
-- 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
ORDER BY ordinal_position;

-- 현재 데이터 확인
SELECT role, pending_role, COUNT(*) as count 
FROM public.users 
GROUP BY role, pending_role; 