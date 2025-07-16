-- GRIGOent 데이터베이스 스키마 참조용
-- 현재 Supabase 프로젝트의 전체 테이블 구조

-- ============================================
-- AUTH 스키마 (Supabase 기본)
-- ============================================

-- 사용자 테이블 (auth.users)
-- id: uuid (PK)
-- email: character varying
-- encrypted_password: character varying
-- email_confirmed_at: timestamp with time zone
-- invited_at: timestamp with time zone
-- confirmation_token: character varying
-- confirmation_sent_at: timestamp with time zone
-- recovery_token: character varying
-- recovery_sent_at: timestamp with time zone
-- email_change_token_new: character varying
-- email_change: character varying
-- email_change_sent_at: timestamp with time zone
-- last_sign_in_at: timestamp with time zone
-- raw_app_meta_data: jsonb
-- raw_user_meta_data: jsonb
-- is_super_admin: boolean
-- created_at: timestamp with time zone
-- updated_at: timestamp with time zone
-- phone: text
-- phone_confirmed_at: timestamp with time zone
-- phone_change: text
-- phone_change_token: character varying
-- phone_change_sent_at: timestamp with time zone
-- confirmed_at: timestamp with time zone
-- email_change_token_current: character varying
-- email_change_confirm_status: smallint
-- banned_until: timestamp with time zone
-- reauthentication_token: character varying
-- reauthentication_sent_at: timestamp with time zone
-- is_sso_user: boolean
-- deleted_at: timestamp with time zone
-- is_anonymous: boolean

-- 세션 테이블 (auth.sessions)
-- id: uuid (PK)
-- user_id: uuid (FK to auth.users)
-- created_at: timestamp with time zone
-- updated_at: timestamp with time zone
-- factor_id: uuid
-- aal: USER-DEFINED
-- not_after: timestamp with time zone
-- refreshed_at: timestamp without time zone
-- user_agent: text
-- ip: inet
-- tag: text

-- ============================================
-- PUBLIC 스키마 (애플리케이션 데이터)
-- ============================================

-- 사용자 관리 테이블 (public.users)
CREATE TABLE public.users (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    name text,
    role text NOT NULL DEFAULT 'client',
    phone text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 아티스트 테이블 (public.artists)
CREATE TABLE public.artists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    profile_image text,
    type text NOT NULL DEFAULT 'main',
    artist_type text NOT NULL DEFAULT 'main', -- 'main', 'choreographer', 'partner_choreographer'
    bio text,
    youtube_links text[],
    team_id uuid REFERENCES public.teams(id),
    order integer DEFAULT 0,
    name_ko text NOT NULL DEFAULT '',
    name_en text,
    name_ja text,
    name_zh text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 아티스트 경력 테이블 (public.artists_careers)
CREATE TABLE public.artists_careers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id uuid REFERENCES public.artists(id),
    type text NOT NULL,
    title text NOT NULL,
    detail text,
    country text,
    video_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- 팀 테이블 (public.teams)
CREATE TABLE public.teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    profile_image text,
    members uuid[],
    bio text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 문의 테이블 (public.inquiries)
CREATE TABLE public.inquiries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_name text NOT NULL,
    manager_name text NOT NULL,
    start_date text,
    end_date text,
    approximate_date text,
    type text,
    place text,
    budget integer,
    currency text,
    budget_undecided boolean DEFAULT false,
    email text,
    phone text,
    message text,
    created_at timestamp with time zone DEFAULT now()
);

-- 문의 타입 테이블 (public.inquiry_types)
CREATE TABLE public.inquiry_types (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL
);

-- 역할 테이블 (public.roles)
CREATE TABLE public.roles (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL
);

-- 통화 테이블 (public.currencies)
CREATE TABLE public.currencies (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    code text NOT NULL,
    name text NOT NULL
);

-- ============================================
-- STORAGE 스키마 (Supabase Storage)
-- ============================================

-- 버킷 테이블 (storage.buckets)
-- id: text (PK)
-- name: text
-- owner: uuid
-- created_at: timestamp with time zone
-- updated_at: timestamp with time zone
-- public: boolean
-- avif_autodetection: boolean
-- file_size_limit: bigint
-- allowed_mime_types: ARRAY
-- owner_id: text
-- type: USER-DEFINED

-- 객체 테이블 (storage.objects)
-- id: uuid (PK)
-- bucket_id: text
-- name: text
-- owner: uuid
-- created_at: timestamp with time zone
-- updated_at: timestamp with time zone
-- last_accessed_at: timestamp with time zone
-- metadata: jsonb
-- path_tokens: ARRAY
-- version: text
-- owner_id: text
-- user_metadata: jsonb
-- level: integer

-- ============================================
-- REALTIME 스키마 (Supabase Realtime)
-- ============================================

-- 메시지 테이블 (realtime.messages)
-- topic: text
-- extension: text
-- payload: jsonb
-- event: text
-- private: boolean
-- updated_at: timestamp without time zone
-- inserted_at: timestamp without time zone
-- id: uuid

-- 구독 테이블 (realtime.subscription)
-- id: bigint
-- subscription_id: uuid
-- entity: regclass
-- filters: ARRAY
-- claims: jsonb
-- claims_role: regrole
-- created_at: timestamp without time zone

-- ============================================
-- VAULT 스키마 (Supabase Vault)
-- ============================================

-- 시크릿 테이블 (vault.secrets)
-- id: uuid (PK)
-- name: text
-- description: text
-- secret: text
-- key_id: uuid
-- nonce: bytea
-- created_at: timestamp with time zone
-- updated_at: timestamp with time zone

-- ============================================
-- 인덱스 및 제약 조건
-- ============================================

-- 아티스트 타입 인덱스
CREATE INDEX IF NOT EXISTS idx_artists_artist_type ON public.artists(artist_type);
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON public.artists(user_id);

-- 아티스트 타입 체크 제약 조건
ALTER TABLE public.artists 
ADD CONSTRAINT IF NOT EXISTS check_artist_type 
CHECK (artist_type IN ('main', 'choreographer', 'partner_choreographer'));

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- 전속안무가 프로필 수정 정책
CREATE POLICY IF NOT EXISTS "Choreographers can update own profile" ON public.artists
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    artist_type IN ('choreographer', 'partner_choreographer')
  );

-- 전속안무가 경력 관리 정책
CREATE POLICY IF NOT EXISTS "Choreographers can manage own careers" ON public.artists_careers
  FOR ALL USING (
    auth.uid() = (
      SELECT user_id FROM public.artists 
      WHERE id = public.artists_careers.artist_id AND 
      artist_type IN ('choreographer', 'partner_choreographer')
    )
  );

-- ============================================
-- 뷰 (Views)
-- ============================================

-- 전속안무가 목록 뷰
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

-- 뷰에 대한 RLS 정책
CREATE POLICY IF NOT EXISTS "Public can view choreographer list" ON public.choreographer_list
  FOR SELECT USING (true);

-- ============================================
-- 샘플 데이터 삽입
-- ============================================

-- 역할 데이터
INSERT INTO public.roles (name) VALUES 
('client'),
('choreographer'),
('partner_choreographer'),
('admin')
ON CONFLICT DO NOTHING;

-- 통화 데이터
INSERT INTO public.currencies (code, name) VALUES 
('KRW', '원'),
('USD', '달러'),
('EUR', '유로'),
('JPY', '엔')
ON CONFLICT DO NOTHING;

-- 문의 타입 데이터
INSERT INTO public.inquiry_types (name) VALUES 
('안무제작'),
('댄서섭외'),
('공연출연'),
('워크샵'),
('기타')
ON CONFLICT DO NOTHING; 