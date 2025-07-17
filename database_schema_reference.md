# GRIGOent 데이터베이스 스키마 참조 문서

## 📊 스키마 개요

현재 데이터베이스는 다음 스키마들로 구성되어 있습니다:
- **auth**: Supabase 인증 관련 테이블들
- **public**: 애플리케이션 메인 데이터 테이블들
- **storage**: 파일 저장 관련 테이블들
- **realtime**: 실시간 기능 관련 테이블들
- **vault**: 보안 관련 테이블들
- **extensions**: PostgreSQL 확장 관련 테이블들

## 🔐 Auth 스키마 (Supabase 기본)

### 주요 테이블

#### users (인증 사용자)
```sql
- id: uuid (PK)
- email: character varying
- encrypted_password: character varying
- email_confirmed_at: timestamp with time zone
- role: character varying
- raw_user_meta_data: jsonb
- raw_app_meta_data: jsonb
- phone: text
- is_super_admin: boolean
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
- is_sso_user: boolean (DEFAULT false)
- is_anonymous: boolean (DEFAULT false)
- deleted_at: timestamp with time zone
```

#### sessions (세션 관리)
```sql
- id: uuid (PK)
- user_id: uuid (FK to auth.users)
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
- factor_id: uuid
- aal: USER-DEFINED
- not_after: timestamp with time zone
- refreshed_at: timestamp without time zone
- user_agent: text
- ip: inet
- tag: text
```

#### identities (소셜 로그인)
```sql
- id: uuid (PK, DEFAULT gen_random_uuid())
- user_id: uuid (FK to auth.users)
- identity_data: jsonb
- provider: text
- last_sign_in_at: timestamp with time zone
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
- email: text
```

### 기타 Auth 테이블들
- **audit_log_entries**: 감사 로그
- **flow_state**: 인증 플로우 상태
- **mfa_***: 다중 인증 관련 테이블들
- **refresh_tokens**: 리프레시 토큰
- **saml_***: SAML 인증 관련 테이블들
- **sso_***: SSO 관련 테이블들

## 🎭 Public 스키마 (애플리케이션 데이터)

### 사용자 관리

#### users (애플리케이션 사용자)
```sql
- id: uuid (PK)
- email: text (NOT NULL)
- name: text
- role: text (NOT NULL, DEFAULT 'general')
- phone: text
- is_active: boolean (DEFAULT true)
- created_at: timestamp with time zone (DEFAULT now())
- updated_at: timestamp with time zone (DEFAULT now())
- pending_role: text
```

### 아티스트 관리

#### artists (아티스트 프로필)
```sql
- id: uuid (PK, DEFAULT gen_random_uuid())
- user_id: uuid (FK to public.users)
- profile_image: text
- type: text (NOT NULL, DEFAULT 'main')
- artist_type: text (NOT NULL, DEFAULT 'main')
- bio: text
- youtube_links: text[]
- team_id: uuid (FK to teams)
- order: integer (DEFAULT 0)
- name_ko: text (NOT NULL, DEFAULT '')
- name_en: text
- name_ja: text
- name_zh: text
- created_at: timestamp with time zone (DEFAULT now())
- updated_at: timestamp with time zone (DEFAULT now())
```

#### artists_careers (아티스트 경력)
```sql
- id: uuid (PK, DEFAULT gen_random_uuid())
- artist_id: uuid (FK to artists)
- type: text (NOT NULL)
- title: text (NOT NULL)
- detail: text
- country: text
- video_url: text
- created_at: timestamp with time zone (DEFAULT now())
```

#### artist_list (아티스트 목록 뷰)
```sql
- user_id: uuid
- email: text
- name: text
- role: text
- phone: text
- is_active: boolean
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
- artist_id: uuid
- profile_image: text
- artist_type: text
- bio: text
- youtube_links: text[]
- name_ko: text
- name_en: text
- name_ja: text
- name_zh: text
- career_count: bigint
```

### 팀 관리

#### teams (팀 정보)
```sql
- id: uuid (PK, DEFAULT gen_random_uuid())
- name: text (NOT NULL)
- profile_image: text
- members: uuid[]
- bio: text
- created_at: timestamp with time zone (DEFAULT now())
- updated_at: timestamp with time zone (DEFAULT now())
```

### 문의 관리

#### inquiries (문의)
```sql
- id: uuid (PK, DEFAULT gen_random_uuid())
- artist_name: text (NOT NULL)
- manager_name: text (NOT NULL)
- start_date: text
- end_date: text
- approximate_date: text
- type: text
- place: text
- budget: integer
- currency: text
- budget_undecided: boolean (DEFAULT false)
- email: text
- phone: text
- message: text
- created_at: timestamp with time zone (DEFAULT now())
```

#### inquiry_types (문의 유형)
```sql
- id: integer (PK, AUTO_INCREMENT)
- name: text (NOT NULL)
```

### 기타

#### roles (역할)
```sql
- id: integer (PK, AUTO_INCREMENT)
- name: text (NOT NULL)
```

#### currencies (통화)
```sql
- id: integer (PK, AUTO_INCREMENT)
- code: text (NOT NULL)
- name: text (NOT NULL)
```

## 💾 Storage 스키마 (파일 저장)

### buckets (저장소)
```sql
- id: text (PK)
- name: text (NOT NULL)
- owner: uuid
- created_at: timestamp with time zone (DEFAULT now())
- updated_at: timestamp with time zone (DEFAULT now())
- public: boolean (DEFAULT false)
- avif_autodetection: boolean (DEFAULT false)
- file_size_limit: bigint
- allowed_mime_types: text[]
- owner_id: text
- type: USER-DEFINED (DEFAULT 'STANDARD')
```

### objects (파일 객체)
```sql
- id: uuid (PK, DEFAULT gen_random_uuid())
- bucket_id: text (FK to storage.buckets)
- name: text
- owner: uuid
- created_at: timestamp with time zone (DEFAULT now())
- updated_at: timestamp with time zone (DEFAULT now())
- last_accessed_at: timestamp with time zone (DEFAULT now())
- metadata: jsonb
- path_tokens: text[]
- version: text
- owner_id: text
- user_metadata: jsonb
- level: integer
```

## 🔄 Realtime 스키마 (실시간 기능)

### subscription (구독)
```sql
- id: bigint (PK)
- subscription_id: uuid (NOT NULL)
- entity: regclass (NOT NULL)
- filters: realtime.user_defined_filter[] (DEFAULT '{}')
- claims: jsonb (NOT NULL)
- claims_role: regrole (NOT NULL)
- created_at: timestamp without time zone (DEFAULT timezone('utc', now()))
```

### messages (메시지)
```sql
- id: uuid (PK, DEFAULT gen_random_uuid())
- topic: text (NOT NULL)
- extension: text (NOT NULL)
- payload: jsonb
- event: text
- private: boolean (DEFAULT false)
- updated_at: timestamp without time zone (DEFAULT now())
- inserted_at: timestamp without time zone (DEFAULT now())
```

## 🔒 Vault 스키마 (보안)

### secrets (보안 정보)
```sql
- id: uuid (PK, DEFAULT gen_random_uuid())
- name: text
- description: text (NOT NULL, DEFAULT '')
- secret: text (NOT NULL)
- key_id: uuid
- nonce: bytea (DEFAULT vault._crypto_aead_det_noncegen())
- created_at: timestamp with time zone (DEFAULT CURRENT_TIMESTAMP)
- updated_at: timestamp with time zone (DEFAULT CURRENT_TIMESTAMP)
```

## 📈 Extensions 스키마

### pg_stat_statements (성능 통계)
PostgreSQL 쿼리 성능 통계를 저장하는 시스템 테이블

## 🔗 주요 관계

### 사용자 관련
- `auth.users` ↔ `public.users` (id로 연결)
- `public.users` ↔ `public.artists` (user_id로 연결)

### 아티스트 관련
- `public.artists` ↔ `public.artists_careers` (artist_id로 연결)
- `public.artists` ↔ `public.teams` (team_id로 연결)

### 뷰 테이블
- `artist_list`: users와 artists를 조인한 뷰

## 🎯 사용자 역할 체계

### 역할 타입
1. **general**: 일반회원 (기본값)
2. **client**: 클라이언트
3. **choreographer**: 전속안무가
4. **partner_choreographer**: 파트너댄서
5. **admin**: 관리자

### 승인 프로세스
- `pending_role`: 승인 대기 중인 역할
- `role`: 현재 활성화된 역할
- 관리자가 승인/거부 결정

## 🔍 주요 인덱스 및 제약조건

### 인덱스
- `artists.user_id` 인덱스 (RLS 정책용)
- `users.email` 유니크 제약조건

### RLS (Row Level Security)
- 사용자별 데이터 접근 제어
- 역할별 권한 관리
- 아티스트 프로필 보안

## 📝 개발 시 주의사항

1. **UUID 사용**: 대부분의 PK가 UUID 타입
2. **타임스탬프**: created_at, updated_at 자동 관리
3. **다국어 지원**: name_ko, name_en, name_ja, name_zh
4. **RLS 정책**: 데이터 보안 강화
5. **트리거**: 자동 데이터 동기화

## 🔄 마이그레이션 히스토리

### 최근 변경사항
- `users` 테이블에 `pending_role` 컬럼 추가
- `artists` 테이블에 `user_id`, `artist_type` 컬럼 추가
- `artist_list` 뷰 생성
- RLS 정책 및 트리거 설정

이 문서는 현재 데이터베이스 스키마의 전체 구조를 참조하기 위한 것입니다. 