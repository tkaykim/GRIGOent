-- 406 오류 해결을 위한 Storage 정책 수정
-- 아티스트 프로필 이미지 접근 문제 해결

-- ============================================
-- 1. 기존 Storage 정책 정리
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- ============================================
-- 2. 새로운 Storage 정책 설정
-- ============================================

-- 모든 사용자가 artist-profiles 버킷의 파일을 조회 가능
CREATE POLICY "Public can view artist profiles" ON storage.objects
    FOR SELECT USING (bucket_id = 'artist-profiles');

-- 인증된 사용자가 파일 업로드 가능
CREATE POLICY "Authenticated users can upload profiles" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'artist-profiles' AND 
        auth.role() = 'authenticated'
    );

-- 파일 소유자가 자신의 파일 수정 가능
CREATE POLICY "Users can update own profile images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'artist-profiles' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 파일 소유자가 자신의 파일 삭제 가능
CREATE POLICY "Users can delete own profile images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'artist-profiles' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- 3. 버킷 설정 확인 및 수정
-- ============================================

-- artist-profiles 버킷이 없다면 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'artist-profiles', 
    'artist-profiles', 
    true, 
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- 4. RLS 정책 확인
-- ============================================

-- artists 테이블 RLS 정책 확인
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
WHERE tablename = 'artists' 
AND schemaname = 'public';

-- ============================================
-- 5. 테스트용 쿼리
-- ============================================

-- 현재 Storage 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- ============================================
-- 완료 메시지
-- ============================================
-- Storage 정책이 수정되었습니다.
-- 이제 406 오류가 해결되어야 합니다. 