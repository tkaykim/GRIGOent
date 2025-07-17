-- Supabase Storage avatars 버킷 생성 (간단 버전)
-- 아티스트 프로필 이미지 저장용

-- ============================================
-- Storage 버킷 생성
-- ============================================

-- avatars 버킷 생성
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
-- 기본 Storage 정책 설정
-- ============================================

-- 모든 사용자가 이미지 조회 가능
CREATE POLICY "avatars_select_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 인증된 사용자만 이미지 업로드 가능
CREATE POLICY "avatars_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

-- ============================================
-- 완료 메시지
-- ============================================
-- avatars 버킷이 생성되었습니다.
-- 이제 아티스트들이 프로필 이미지를 업로드할 수 있습니다. 