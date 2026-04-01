# ODP Corp 제품 카탈로그 (리뉴얼)

(주)오디피(ODP Corp)의 기존 웹사이트(www.odpcorp.co.kr)를 개편한 현대적인 제품 카탈로그 웹 서비스입니다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | ODP Corp 제품 카탈로그 리뉴얼 |
| **원본 사이트** | https://www.odpcorp.co.kr/index/s2/s2_list.php |
| **목적** | 오래된 기존 사이트의 상품 목록 페이지를 최신 UI/UX로 개편 |
| **언어** | 한국어 (ko) |
| **상태** | 개발 완료 (v1.0) |

---

## 2. 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| **Next.js** | 14.2.x | App Router 기반 프레임워크 |
| **React** | 18.3.x | UI 라이브러리 |
| **TypeScript** | 5.x | 정적 타입 시스템 |
| **Tailwind CSS** | 3.4.x | 유틸리티 기반 CSS 프레임워크 |
| **Fuse.js** | 7.x | 클라이언트 사이드 퍼지 검색 엔진 |
| **pnpm** | 10.x | 패키지 매니저 |
| **Noto Sans KR** | - | 한국어 최적화 웹폰트 (Google Fonts) |

### 아키텍처 선택 사유

- **SSG (Static Site Generation)**: 제품 데이터가 정적(84개 제품, 407개 파트넘버)이며 사용자 생성 콘텐츠가 없으므로 빌드 타임에 전체 페이지를 사전 생성합니다. 별도 백엔드 서버가 필요 없습니다.
- **App Router**: Next.js 14의 파일 기반 라우팅으로 카테고리 > 시리즈 > 제품 계층 구조를 자연스럽게 매핑합니다.
- **Fuse.js**: 407개 파트넘버는 클라이언트 사이드 검색으로 충분히 처리 가능하며, 별도 검색 서버가 필요 없습니다.

---

## 3. 데이터 스펙

### 3.1 데이터 출처

기존 사이트(www.odpcorp.co.kr)에서 2단계로 스크래핑하여 수집했습니다.

- **1단계**: 시리즈 목록 페이지에서 84개 제품의 기본 정보 수집 (모델명, 용량, 이미지, 입출력 사양)
- **2단계**: 각 제품 상세 페이지에서 407개 개별 파트넘버 수집 (입력전압 x 출력전압 조합별)

### 3.2 데이터 규모

| 항목 | 수량 |
|------|------|
| **카테고리** | 3개 (DCDC, POL, ACDC) |
| **시리즈** | 23개 |
| **제품 (모델)** | 84개 |
| **개별 파트넘버** | 407개 |
| **데이터 파일 크기** | ~180KB (JSON) |

### 3.3 카테고리별 상세

#### DCDC Converter (6개 시리즈, 23개 제품, 257개 파트넘버)

| 시리즈 | 제품 수 | 파트넘버 수 | 모델 목록 | 설명 |
|--------|---------|-------------|-----------|------|
| SD Series | 5 | 120 | SDS1R5, SDS3, SDS6, SDS10, SDS20 | RCC 방식, 초소형 SMD/DIP |
| VDS Series | 4 | 32 | VDS1R5, VDS3, VDS6, VDS10 | 4:1 입력범위, SIP 타입 |
| D Series | 7 | 69 | DS1R5, DS3, DS6, DS10, DS15, DS25, DS30 | 플라이백 방식, 소형 |
| DH Series | 4 | 10 | DHS3, DHS10, DHS15, DHS25 | 플라이백, 경량 |
| WD Series | 2 | 10 | WD10, WD15 | 동기정류, 세라믹캐패시터 |
| KSP Series | 1 | 16 | KSP50 | 액티브클램프, 초고효율 |

#### POL - Point of Load (3개 시리즈, 6개 제품, 6개 파트넘버)

| 시리즈 | 제품 수 | 모델 목록 | 설명 |
|--------|---------|-----------|------|
| OPS5A Series | 2 | OPS5A-5, OPS5A-12 | 비절연 강압 DC-DC, 5A |
| OPS10A Series | 2 | OPS10A-5, OPS10A-12 | 비절연 강압 DC-DC, 10A |
| OPS15A Series | 2 | OPS15A-5, OPS15A-12 | 비절연 강압 DC-DC, 15A |

#### ACDC / SMPS (14개 시리즈, 55개 제품, 144개 파트넘버)

| 시리즈 | 제품 수 | 파트넘버 수 | 모델 목록 | 설명 |
|--------|---------|-------------|-----------|------|
| NOF Series | 11 | 41 | NOF5~NOF150, NOFD40/60/100 | 초소형 AC-DC, CB인증 |
| OF Series | 10 | 27 | OFS10~OFS150F, OFD75 | 오픈프레임 AC-DC |
| HNF Series | 5 | 22 | HNF20~HNF100 | 220V 전용, 저가형 |
| COF Series | 0 | 0 | (등록된 제품 없음) | 초소형 AC-DC (준비중) |
| KMS Series | 4 | 0 | KMS40~KMS100 | 의료기용, 2MOPP |
| PF Series | 3 | 12 | PF75, PF100, PF150 | LLC 공진, PFC 내장 |
| TS Series | 2 | 8 | TS5, TS10 | 소형 AC-DC |
| TS Series (TB) | 2 | 0 | TS5-TB, TS10-TB | TB 타입 |
| LTS Series | 2 | 0 | LTS5, LTS10 | 저가형 소형 AC-DC |
| LTS Series (TB) | 2 | 0 | LTS5-TB, LTS10-TB | TB 타입 |
| HS Series | 4 | 22 | HS10~HS60 | 오픈프레임 AC-DC |
| HS Series (TB) | 4 | 0 | HS10-TB~HS60-TB | TB 타입 |
| EHS Series | 3 | 12 | EHS15, EHS25, EHS50 | 220V 전용 |
| EHS Series (TB) | 3 | 0 | EHS15-TB~EHS50-TB | TB 타입 |

### 3.4 데이터 구조 (TypeScript 타입)

```typescript
// 카테고리별로 다른 필드를 가진 제품 타입
interface BaseProduct {
  model: string;              // 모델명 (예: "SDS1R5")
  model_dual?: string;        // 이중출력 모델명 (예: "SDD1R5")
  image_url: string;          // 제품 이미지 URL
  detail_url: string;         // 원본 사이트 상세 페이지 URL
  output_options: OutputOption[];  // 출력 사양 목록
  certifications: string[];   // 인증 (CE, CB, RoHS 등)
  part_numbers?: string[];    // 개별 파트넘버 목록
  parts_detail?: PartDetail[];// 파트넘버 상세 (입력전압, 출력전압)
}

// DCDC: 복수 입력전압 범위, 고정 와트
interface DCDCProduct extends BaseProduct {
  power_watts: number;
  input_voltage_ranges: string[];  // ["DC 4.5~9.0V", "DC 9.0~18.0V", ...]
}

// POL: 가변 와트 범위
interface POLProduct extends BaseProduct {
  power_watts_range: string;       // "3.25~18.15"
  input_voltage_ranges: string[];
}

// ACDC: 단일 입력전압 문자열, 고정 와트
interface ACDCProduct extends BaseProduct {
  power_watts: number;
  input_voltage: string;           // "AC 90~264V or DC 120~370V"
}

// 파트넘버 상세
interface PartDetail {
  part_number: string;   // "SDS1R5-05-3R3"
  input_voltage: string; // "DC 4.5~9V"
  output_voltage: string;// "3.3V"
}
```

### 3.5 파트넘버 네이밍 규칙

- **DCDC**: `{모델}-{입력전압코드}-{출력전압코드}` (예: `SDS1R5-24-05` = 24V입력, 5V출력)
- **ACDC**: `{모델}-{출력전압코드}` (예: `NOF40-12` = 12V출력)
- **POL**: 모델명 자체가 파트넘버 (예: `OPS5A-5`)

---

## 4. 페이지 구조 및 라우팅

### 4.1 URL 구조

| URL 패턴 | 페이지 | SSG 페이지 수 |
|----------|--------|---------------|
| `/` | 홈페이지 | 1 |
| `/products` | 전체 제품 목록 | 1 |
| `/products/[categoryId]` | 카테고리별 시리즈 목록 | 3 (DCDC, POL, ACDC) |
| `/products/[categoryId]/[seriesCate]` | 시리즈별 제품 비교 | 23 |
| `/products/detail/[model]` | 제품 상세 | 84 |
| `/search?q=...` | 검색 결과 | 1 (CSR) |
| `/about` | 회사소개 | 1 |
| (404) | Not Found | 1 |

**총 SSG 페이지**: 약 114개

### 4.2 페이지별 기능 명세

#### 홈페이지 (`/`)
- 히어로 섹션: 회사 슬로건, 제품/검색 CTA 버튼
- 통계: 407개 파트넘버 / 84개 제품 / 23개 시리즈
- 3개 카테고리 카드 (DCDC=파란색, POL=틸, ACDC=앰버)

#### 전체 제품 (`/products`)
- 3개 카테고리 섹션으로 구분
- 각 카테고리별 시리즈 카드 그리드 (2열 데스크톱, 1열 모바일)

#### 카테고리 (`/products/[categoryId]`)
- 해당 카테고리의 시리즈 카드 그리드
- 시리즈 카드: 대표 이미지, 시리즈명, 패키지 타입, 용량 범위, 제품 수, 파트넘버 수, 인증 뱃지

#### 시리즈 (`/products/[categoryId]/[seriesCate]`)
- 시리즈 헤더: 이름, 패키지, 용량 범위, 설명, 주요 특징 목록, 인증
- 제품 비교 테이블 (데스크톱): 이미지, 모델명, 용량, 입력전압, 출력, 파트넘버 수, 인증
- 제품 카드 (모바일): 반응형 카드 레이아웃

#### 제품 상세 (`/products/detail/[model]`)
- 제품 이미지 (외부 URL, unoptimized)
- 모델명, 이중출력 모델명, 용량
- 입력전압 범위 뱃지
- 인증 뱃지
- **파트넘버 테이블**: 개별 파트넘버별 입력전압/출력전압 매트릭스
- 출력 사양 테이블 (전압/전류)
- 시리즈 특징 목록
- 같은 시리즈 다른 제품 링크
- 원본 사이트 링크

#### 검색 (`/search`)
- 클라이언트 사이드 Fuse.js 퍼지 검색
- 검색 대상: 모델명, 파트넘버, 시리즈명, 카테고리, 용량, 전압, 인증
- 예시 키워드 제공: SDS10, 24V, ACDC, NOF, Medical, 50W
- 검색 결과: 카테고리 뱃지 + 이미지 + 모델명 + 용량 + 입력전압 + 인증

#### 회사소개 (`/about`)
- 회사 정보: (주)오디피, 전력 변환 솔루션 전문기업
- 연락처: 031-445-7488, 경기도 안양시
- 통계 (제품/시리즈/카테고리 수)
- 주요 제품군, 인증 현황

---

## 5. 프로젝트 구조

```
odp_renewal/
├── public/                         # 정적 에셋
├── src/
│   ├── app/                        # Next.js App Router 페이지 (7개 라우트)
│   │   ├── layout.tsx              # 루트 레이아웃 (한국어, Noto Sans KR, Header/Footer)
│   │   ├── globals.css             # Tailwind 기본 스타일
│   │   ├── page.tsx                # 홈페이지
│   │   ├── not-found.tsx           # 404 페이지
│   │   ├── products/
│   │   │   ├── page.tsx            # 전체 제품
│   │   │   ├── [categoryId]/
│   │   │   │   ├── page.tsx        # 카테고리 (DCDC/POL/ACDC)
│   │   │   │   └── [seriesCate]/
│   │   │   │       └── page.tsx    # 시리즈 (SD/VDS/D/... 23개)
│   │   │   └── detail/
│   │   │       └── [model]/
│   │   │           └── page.tsx    # 제품 상세 (84개)
│   │   ├── search/
│   │   │   └── page.tsx            # 검색 (클라이언트 컴포넌트)
│   │   └── about/
│   │       └── page.tsx            # 회사소개
│   │
│   ├── components/                 # 재사용 컴포넌트 (11개)
│   │   ├── layout/
│   │   │   ├── Header.tsx          # 글로벌 헤더 (네비게이션, 모바일 햄버거)
│   │   │   └── Footer.tsx          # 글로벌 푸터 (회사 정보, 링크)
│   │   ├── product/
│   │   │   ├── CategoryCard.tsx    # 카테고리 카드 (아이콘, 설명, 통계)
│   │   │   ├── SeriesCard.tsx      # 시리즈 카드 (이미지, 스펙, 파트넘버 수)
│   │   │   ├── ProductTable.tsx    # 제품 비교 테이블 (반응형: 테이블/카드)
│   │   │   └── OutputTable.tsx     # 출력 사양 테이블
│   │   ├── search/
│   │   │   ├── SearchBar.tsx       # 검색 입력 (디바운스, 클라이언트)
│   │   │   └── SearchResults.tsx   # 검색 결과 목록 (Fuse.js)
│   │   └── ui/
│   │       ├── Container.tsx       # 반응형 컨테이너 (max-w-7xl)
│   │       ├── Breadcrumb.tsx      # 브레드크럼 네비게이션
│   │       └── Badge.tsx           # 인증 뱃지 (CB/CE/RoHS/Medical)
│   │
│   ├── data/
│   │   └── odp_products.json       # 제품 데이터 (84제품, 407파트넘버)
│   │
│   ├── lib/                        # 비즈니스 로직
│   │   ├── catalog.ts              # 데이터 접근 함수 (12개 함수)
│   │   ├── search.ts               # Fuse.js 검색 엔진 설정
│   │   └── utils.ts                # 유틸리티 (cn 클래스 합성)
│   │
│   └── types/
│       └── product.ts              # TypeScript 타입 정의 + 타입 가드
│
├── package.json                    # 의존성 (pnpm)
├── next.config.mjs                 # Next.js 설정 (이미지 도메인)
├── tailwind.config.ts              # Tailwind 커스텀 설정
├── tsconfig.json                   # TypeScript 설정
├── postcss.config.mjs              # PostCSS 설정
├── .eslintrc.json                  # ESLint 설정
└── README.md                       # 이 문서
```

**소스 코드**: 1,575줄 (TypeScript/TSX/CSS)

---

## 6. 디자인 시스템

### 6.1 컬러 팔레트

| 용도 | 색상 | 코드 |
|------|------|------|
| 헤더/푸터 배경 | Deep Navy | `#1a2332` |
| 주 액센트 | Electric Blue | `#2563eb` |
| DCDC 카테고리 | Blue | `#2563eb` (bg: `blue-50`) |
| POL 카테고리 | Teal | `#0d9488` (bg: `teal-50`) |
| ACDC 카테고리 | Amber | `#d97706` (bg: `amber-50`) |
| 본문 텍스트 | Near Black | `#0f172a` (slate-900) |
| 보조 텍스트 | Gray | `#64748b` (slate-500) |
| 인증 CB | Blue | `blue-100` / `blue-700` |
| 인증 CE | Green | `green-100` / `green-700` |
| 인증 RoHS | Gray | `slate-100` / `slate-600` |
| 인증 Medical | Purple | `purple-100` / `purple-700` |

### 6.2 타이포그래피

- **본문**: Noto Sans KR (300, 400, 500, 700)
- **모델명/스펙**: JetBrains Mono / 시스템 monospace (`font-mono`)

### 6.3 반응형 브레이크포인트

| 크기 | Tailwind | 적용 |
|------|----------|------|
| 모바일 | `< md` (768px) | 카드 레이아웃, 햄버거 메뉴 |
| 데스크톱 | `md` 이상 | 테이블 레이아웃, 네비게이션 바 |
| 와이드 | `lg` (1024px) | 2열 그리드, 상세 페이지 2열 |

---

## 7. 주요 컴포넌트 명세

### 7.1 데이터 접근 함수 (`lib/catalog.ts`)

| 함수 | 반환 타입 | 설명 |
|------|-----------|------|
| `getCompanyInfo()` | `{company, website, phone}` | 회사 기본 정보 |
| `getAllCategories()` | `Category[]` | 전체 카테고리 (3개) |
| `getCategoryById(id)` | `Category \| undefined` | ID로 카테고리 조회 |
| `getSeriesByCate(cate)` | `{series, category} \| undefined` | cate 코드로 시리즈 조회 |
| `getProductByModel(model)` | `FlatProduct \| undefined` | 모델명으로 제품 조회 |
| `getAllProductsFlat()` | `FlatProduct[]` | 전체 제품 플랫 목록 |
| `getCategoryProductCount(cat)` | `number` | 카테고리 내 제품 수 |
| `getCategoryPartCount(cat)` | `number` | 카테고리 내 파트넘버 수 |
| `getTotalPartCount()` | `number` | 전체 파트넘버 수 |
| `getSeriesPartCount(series)` | `number` | 시리즈 내 파트넘버 수 |
| `getSeriesPowerRange(series)` | `string` | 시리즈 용량 범위 (예: "1.5~20W") |
| `getAllModels()` | `string[]` | 전체 모델명 (SSG params용) |

### 7.2 검색 엔진 (`lib/search.ts`)

Fuse.js 기반 클라이언트 사이드 퍼지 검색:

| 검색 필드 | 가중치 | 설명 |
|-----------|--------|------|
| model | 3.0 | 모델명 (최우선) |
| modelDual | 2.0 | 이중출력 모델명 |
| partNumbers | 2.0 | 개별 파트넘버 |
| seriesName | 1.5 | 시리즈명 |
| categoryName | 1.0 | 카테고리명 |
| power | 1.0 | 용량 (W) |
| voltages | 0.8 | 입력전압 |
| certifications | 0.5 | 인증 |

- 매칭 임계값: 0.35
- 최대 결과: 30건

---

## 8. 설치 및 실행

### 사전 요구사항

- **Node.js** 18 이상
- **pnpm** (`npm install -g pnpm`)

### 설치

```bash
cd odp_renewal
pnpm install
```

### 개발 서버

```bash
pnpm dev
```

→ http://localhost:3000

### 프로덕션 빌드

```bash
pnpm build
pnpm start
```

---

## 9. 제약사항 및 알려진 이슈

- **제품 이미지**: 원본 사이트(`www.odpcorp.co.kr`)에서 직접 로드합니다. 원본 사이트가 다운되면 이미지가 표시되지 않습니다.
- **COF Series**: 원본 사이트에 등록된 제품이 없어 빈 시리즈입니다 (UI에서 자동 필터링).
- **KMS Series**: 의료기용 제품으로 파트넘버 상세가 원본 사이트에 미등록 상태입니다.
- **TB Type 시리즈**: TS-TB, LTS-TB, HS-TB, EHS-TB 시리즈의 파트넘버 상세가 미수집입니다.
- **파트넘버 일부 추정**: 페이지네이션 제한으로 일부 파트넘버는 네이밍 패턴 기반으로 생성되었습니다.
- **next/image unoptimized**: 외부 도메인 이미지에 대해 Next.js 이미지 최적화를 비활성화했습니다.
