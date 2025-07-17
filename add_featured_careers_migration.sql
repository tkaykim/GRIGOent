-- artists_careers 테이블에 대표경력 위치 컬럼 추가
-- featured_position: 1, 2, 3, 4 (대표경력1~4) 또는 NULL (일반 경력)
-- 각 카테고리별로 4개씩 대표경력 등록 가능

ALTER TABLE public.artists_careers 
ADD COLUMN featured_position integer CHECK (featured_position >= 1 AND featured_position <= 4);

-- 한 아티스트의 같은 카테고리에서 같은 위치에 하나의 대표경력만 허용하는 유니크 제약 조건
ALTER TABLE public.artists_careers 
ADD CONSTRAINT unique_artist_type_featured_position 
UNIQUE (artist_id, type, featured_position);

-- 인덱스 추가 (대표경력 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_artists_careers_featured_position 
ON public.artists_careers(featured_position);

CREATE INDEX IF NOT EXISTS idx_artists_careers_artist_type_featured 
ON public.artists_careers(artist_id, type, featured_position);

-- 기존 데이터에 대한 설명
-- featured_position이 NULL인 경우: 일반 경력
-- featured_position이 1~4인 경우: 해당 카테고리의 대표경력1~4 (아티스트 소개에서 상단에 표시)
-- 각 카테고리(안무제작, 방송출연, 행사출연, 광고출연, 댄서참여, 워크샵)별로 4개씩 대표경력 등록 가능 