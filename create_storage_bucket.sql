-- Supabase Storage avatars 버킷 생성
-- 아티스트 프로필 이미지 저장용

-- ============================================
-- Storage 버킷 생성
-- ============================================

-- avatars 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage 정책 설정
-- ============================================

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- 모든 사용자가 이미지 조회 가능
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 인증된 사용자만 이미지 업로드 가능
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

-- 사용자는 자신의 이미지만 업데이트 가능
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 사용자는 자신의 이미지만 삭제 가능
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- 완료 메시지
-- ============================================
-- avatars 버킷이 생성되었습니다.
-- 이제 아티스트들이 프로필 이미지를 업로드할 수 있습니다. 