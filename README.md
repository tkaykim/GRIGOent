# 그리고 엔터테인먼트 웹사이트

그리고 엔터테인먼트의 공식 웹사이트입니다. 안무제작, 댄서섭외, 아티스트 매니지먼트 서비스를 제공합니다.

## 🚀 주요 기능

### 👥 사용자 권한 시스템
- **클라이언트**: 일반 사용자, 문의 및 서비스 이용
- **전속안무가**: 자신의 프로필과 경력 관리
- **파트너안무가**: 협력 안무가
- **관리자**: 전체 시스템 관리

### 🎭 전속안무가 대시보드
- **프로필 관리**: 이름, 소개, 유튜브 링크 등록/수정
- **경력 관리**: 카테고리별 경력 등록/수정
  - 안무제작
  - 방송출연
  - 행사출연
  - 광고출연
  - 댄서참여
  - 워크샵
- **실시간 저장**: 모든 변경사항이 즉시 데이터베이스에 저장

### 🌐 다국어 지원
- 한국어 (KR)
- 영어 (EN)

### 📱 반응형 디자인
- PC, 태블릿, 모바일 최적화
- 햄버거 메뉴 (모바일)
- 상단 네비게이션 (PC)

## 🗄️ 데이터베이스 구조

### 기존 테이블
- `auth.users`: 사용자 인증 정보
- `users`: 사용자 프로필 정보
- `artists`: 아티스트 정보
- `artists_careers`: 아티스트 경력 정보

### 새로운 테이블 (전속안무가용)
- `choreographer_profiles`: 전속안무가 프로필
- `choreographer_careers`: 전속안무가 경력

### 보안 정책 (RLS)
- 사용자는 자신의 데이터만 접근 가능
- 관리자는 모든 데이터 조회 가능
- 자동 권한 검증

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Railway

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── auth/           # 인증 페이지
│   ├── choreographer/  # 전속안무가 대시보드
│   ├── choreographers/ # 전속안무가 목록/상세
│   ├── admin/          # 관리자 페이지
│   ├── artists/        # 아티스트 페이지
│   ├── contact/        # 문의 페이지
│   └── dashboard/      # 일반 대시보드
├── components/         # 재사용 컴포넌트
├── utils/             # 유틸리티 함수
└── locales/           # 다국어 파일
```

## 🚀 설치 및 실행

1. **의존성 설치**
```bash
npm install
```

2. **환경 변수 설정**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **데이터베이스 설정**
- Supabase 프로젝트 생성
- `database_schema.sql` 실행하여 테이블 생성
- RLS 정책 설정

4. **개발 서버 실행**
```bash
npm run dev
```

## 📋 주요 페이지

### 🏠 홈페이지 (`/`)
- 메인 비디오 배경
- 회사 소개
- 아티스트 미리보기

### 👤 전속안무가 대시보드 (`/choreographer/dashboard`)
- 프로필 편집
- 경력 관리
- 실시간 저장

### 📋 전속안무가 목록 (`/choreographers`)
- 등록된 전속안무가 목록
- 프로필 카드 형태로 표시

### 🎭 아티스트 페이지 (`/artists`)
- 아티스트 목록 및 상세 정보
- 경력 및 미디어 표시

### 📞 문의 페이지 (`/contact`)
- 프로젝트 문의 폼
- 아티스트 선택 기능

## 🔐 보안 기능

- **Row Level Security (RLS)**: 데이터베이스 레벨 보안
- **권한 기반 접근**: 사용자 역할에 따른 기능 제한
- **인증 상태 관리**: 전역 상태로 로그인 상태 관리

## 🌟 주요 특징

- **실시간 업데이트**: 모든 변경사항이 즉시 반영
- **직관적인 UI**: 사용자 친화적인 인터페이스
- **성능 최적화**: 이미지 지연 로딩, 코드 스플리팅
- **접근성**: 키보드 네비게이션, 스크린 리더 지원

## 📝 라이센스

© 2024 그리고 엔터테인먼트. All rights reserved.
