-- users 테이블 RLS 정책 수정 및 트리거 추가
-- 회원가입 시 자동 동기화

-- ============================================
-- 1. 기존 정책 및 트리거 정리
-- ============================================

-- 기존 INSERT 정책 삭제 (트리거로 대체)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- 기존 트리거 삭제 (있는 경우)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- 2. 트리거 함수 생성
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, phone, is_active, pending_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'general',
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    true,
    COALESCE(NEW.raw_user_meta_data->>'pending_role', null)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. 트리거 생성
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. RLS 정책 수정
-- ============================================

-- 모든 사용자가 users 테이블 조회 가능
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
CREATE POLICY "Users are viewable by everyone" ON public.users
    FOR SELECT USING (true);

-- 사용자는 자신의 프로필만 수정 가능
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 5. 현재 정책 확인
-- ============================================

-- users 테이블의 모든 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;

-- 트리거 확인
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth'
ORDER BY trigger_name;

-- ============================================
-- 완료 메시지
-- ============================================
-- 트리거가 생성되어 auth.users에서 public.users로 자동 동기화됩니다.
-- 이제 회원가입이 정상적으로 작동할 것입니다. 