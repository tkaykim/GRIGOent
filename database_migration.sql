-- GRIGOent 데이터베이스 마이그레이션 스크립트
-- 기존 artists 테이블에 artist_type 컬럼 추가

-- 1. artists 테이블에 artist_type 컬럼 추가
ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS artist_type text NOT NULL DEFAULT 'main';

-- 2. user_id 컬럼이 없다면 추가 (이미 있다면 무시됨)
ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 3. artist_type에 대한 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_artists_artist_type ON public.artists(artist_type);
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON public.artists(user_id);

-- 4. RLS 정책 추가 (전속안무가가 자신의 프로필만 수정 가능)
CREATE POLICY IF NOT EXISTS "Choreographers can update own profile" ON public.artists
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    artist_type IN ('choreographer', 'partner_choreographer')
  );

-- 5. 전속안무가가 자신의 경력만 관리할 수 있는 정책
CREATE POLICY IF NOT EXISTS "Choreographers can manage own careers" ON public.artists_careers
  FOR ALL USING (
    auth.uid() = (
      SELECT user_id FROM public.artists 
      WHERE id = public.artists_careers.artist_id AND 
      artist_type IN ('choreographer', 'partner_choreographer')
    )
  );

-- 6. 기존 데이터 업데이트 (필요한 경우)
-- 기존 아티스트들을 main 타입으로 설정
UPDATE public.artists 
SET artist_type = 'main' 
WHERE artist_type IS NULL;

-- 7. artist_type에 대한 체크 제약 조건 추가
ALTER TABLE public.artists 
ADD CONSTRAINT IF NOT EXISTS check_artist_type 
CHECK (artist_type IN ('main', 'choreographer', 'partner_choreographer'));

-- 8. 뷰 생성 (전속안무가 목록용)
CREATE OR REPLACE VIEW public.choreographer_list AS
SELECT 
  id,
  name_ko,
  name_en,
  bio,
  profile_image,
  youtube_links,
  created_at,
  updated_at,
  (SELECT COUNT(*) FROM public.artists_careers WHERE artist_id = a.id) as career_count
FROM public.artists a
WHERE artist_type = 'choreographer';

-- 9. 뷰에 대한 RLS 정책
CREATE POLICY IF NOT EXISTS "Public can view choreographer list" ON public.choreographer_list
  FOR SELECT USING (true);

-- 마이그레이션 완료 메시지
SELECT 'Database migration completed successfully!' as status; 