-- 관리자 권한 승인/거부 문제 해결 SQL
-- RLS 정책 및 권한 설정 수정

-- ============================================
-- 1. 현재 RLS 정책 확인
-- ============================================

-- users 테이블 RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;

-- ============================================
-- 2. 기존 RLS 정책 정리
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;

-- ============================================
-- 3. 새로운 RLS 정책 설정
-- ============================================

-- 모든 사용자가 users 테이블 조회 가능
CREATE POLICY "Users are viewable by everyone" ON public.users
    FOR SELECT USING (true);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 관리자는 모든 사용자 정보 수정 가능 (권한 승인/거부 포함)
CREATE POLICY "Admin can manage all users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 관리자는 모든 사용자 정보 삽입 가능
CREATE POLICY "Admin can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 관리자는 모든 사용자 정보 삭제 가능
CREATE POLICY "Admin can delete users" ON public.users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 4. RLS 활성화 확인
-- ============================================

-- users 테이블 RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. 권한 설정 확인
-- ============================================

-- authenticated 역할에 필요한 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- 6. 테스트용 쿼리
-- ============================================

-- 현재 사용자 권한 확인
SELECT 
    current_user,
    session_user,
    current_setting('role') as current_role;

-- 관리자 권한으로 users 테이블 업데이트 테스트
-- (실제로는 실행하지 않음)
-- UPDATE public.users SET role = 'test' WHERE id = 'test-id';

-- ============================================
-- 7. 트리거 함수 권한 확인
-- ============================================

-- 트리거 함수 실행 권한 확인
SELECT 
    proname,
    proowner,
    prosecdef,
    proacl
FROM pg_proc 
WHERE proname = 'create_artist_profile';

-- 트리거 함수에 SECURITY DEFINER 추가 (필요한 경우)
-- CREATE OR REPLACE FUNCTION public.create_artist_profile()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- 기존 로직
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. 최종 확인
-- ============================================

-- 모든 RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 완료 메시지
-- ============================================
-- RLS 정책이 수정되었습니다.
-- 이제 관리자가 권한 승인/거부를 정상적으로 수행할 수 있습니다. 