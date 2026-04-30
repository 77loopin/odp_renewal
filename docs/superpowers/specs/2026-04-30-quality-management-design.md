# 부적합품 관리(품질관리) 페이지 설계 문서

- 작성일: 2026-04-30
- 작성자: 협업 (사용자 + Claude)
- 대상: `odp_renewal` (Next.js 14 App Router)

## 1. 목적

각 모델의 부적합 이력을 등록·검색·통계 조회할 수 있는 페이지를 추가한다. 핵심 사용 시나리오는 **수리 시 "이 모델에서 이 부적합 내용은 어떤 원인이 가장 잦은가"를 빠르게 확인**하는 것이다.

## 2. 결정 요약 (Decisions)

| 항목 | 결정 |
|---|---|
| 데이터 저장 | SQLite 파일 (`data/quality.db`) |
| 엑셀 업로드 동작 | Upsert (`nc_no` 기준) |
| 화면 등록 NC 번호 | `WNC` + YY + 5자리, 자동 채번 (예: `WNC260001`) |
| 엑셀 NC 번호 | 기존 `NC` + YY + 5자리 유지 |
| 통계 범위 | A(원인 랭킹) 강조 + B(모델 대시보드) + C(전사 대시보드) |
| 인증 | 단일 비밀번호 (등록·수정·삭제·업로드만 보호, 조회·통계 공개) |
| 수정·삭제 | 가능 |
| 메뉴 | Header에 `품질관리` 추가, URL `/quality` |
| SQLite 드라이버 | `better-sqlite3` |
| 엑셀 파싱 | `xlsx` (SheetJS) |
| 차트 | `recharts` |

## 3. 데이터 모델

DB 파일: `data/quality.db` (gitignore, 첫 실행 시 자동 생성). 마이그레이션은 단순 `CREATE TABLE IF NOT EXISTS` 단계로 시작.

```sql
CREATE TABLE non_conformance (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nc_no         TEXT    NOT NULL UNIQUE,
  source        TEXT    NOT NULL CHECK(source IN ('excel','web')),
  written_date  TEXT    NOT NULL,           -- ISO 'YYYY-MM-DD'
  model_name    TEXT    NOT NULL,
  lot_no        TEXT,
  defect        TEXT    NOT NULL,
  cause         TEXT,
  action        TEXT,
  result        TEXT,
  handler       TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_nc_model        ON non_conformance(model_name);
CREATE INDEX idx_nc_date         ON non_conformance(written_date);
CREATE INDEX idx_nc_model_defect ON non_conformance(model_name, defect);
CREATE INDEX idx_nc_lot          ON non_conformance(lot_no);
```

**필수/선택**
- 필수: `nc_no`, `written_date`, `model_name`, `defect`
- 선택(NULL 허용): `lot_no`, `cause`, `action`, `result`, `handler`

**채번 규칙 (web)**: `WNC` + 두자리 연도 + 5자리 zero-pad. 같은 연도 prefix 내에서 `MAX(뒷5자리) + 1`. 첫 건은 `WNC260001`.

**날짜 정규화 (import 시)**: `2025.01.02`, `2025/1/2`, `2025-01-02`, Excel serial number 모두 `YYYY-MM-DD`로 통일. 파싱 실패 시 해당 행 에러로 기록.

## 4. 화면 / 라우트 구조

```
/quality              검색 + 리스트 (메인) — 공개
/quality/new          신규 등록 — 비밀번호 보호
/quality/import       엑셀 업로드 — 비밀번호 보호
/quality/stats        통계 (3개 탭) — 공개
/quality/[nc_no]      상세 / 수정 / 삭제 — 수정·삭제는 비밀번호 보호
```

Header 메뉴에 `품질관리` 항목 추가 (홈/제품/회사소개 다음).

## 5. API Routes

```
GET    /api/quality                     검색·리스트 (q, model, defect, cause, action, lot, from, to, page, pageSize, sort)
POST   /api/quality                     신규 등록  [pw]
GET    /api/quality/[nc_no]             상세
PATCH  /api/quality/[nc_no]             수정      [pw]
DELETE /api/quality/[nc_no]             삭제      [pw]
POST   /api/quality/import              엑셀 업로드 (multipart) [pw]
GET    /api/quality/stats/causes        원인 랭킹 (model, defect)
GET    /api/quality/stats/model         모델 대시보드 (model)
GET    /api/quality/stats/global        전사 대시보드
GET    /api/quality/options             distinct 모델/내용/원인/조치사항 (자동완성용)
```

**비밀번호 검증**: `process.env.QUALITY_ADMIN_PASSWORD`와 `crypto.timingSafeEqual` 비교. 변경 계열 요청은 `x-quality-password` 헤더 필수. 클라이언트는 모달에서 받아 `sessionStorage`에 보관.

## 6. UX 상세

### 6.1 `/quality` (검색 + 리스트)
- 상단 필터 바: 통합검색 / 모델명 combobox / 부적합내용 combobox / 원인 combobox / 조치사항 combobox / LOT input / 기간 from~to / 초기화 / 검색 버튼
- 콤보박스 옵션은 `/api/quality/options` 결과로 채움 (자동완성 + 직접입력 가능)
- 디바운스 300ms 자동 검색, URL 쿼리스트링과 동기화 (`/quality?model=...&defect=...`)
- 우상단 액션: `+ 신규 등록`, `엑셀 업로드`, `통계`
- 테이블 컬럼: NC번호 / 일자 / 모델명 / LOT / 부적합 내용 / 원인 / 조치 / 처리결과 / 처리자 / source 뱃지(엑셀·수기)
- 정렬: 일자 desc 기본. 일자/NC번호/모델명 헤더 클릭으로 토글
- 페이지네이션: 50/100/200 선택, 하단 `< 1 2 ... N >`
- 행 클릭 → `/quality/[nc_no]` 상세

### 6.2 `/quality/new` 신규 등록
- 폼: 일자(date picker, 오늘 default) / 모델명(combobox, 자동완성) / LOT / 부적합 내용 / 원인 / 조치사항 / 처리결과 / 처리자
- nc_no는 자동 생성, 폼에는 표시만 (read-only preview, 저장 시점 서버에서 최종 결정)
- 제출 → 비밀번호 모달 → API 호출 → 성공 시 `/quality/[nc_no]`로 이동

### 6.3 `/quality/import` 엑셀 업로드
- 파일 드롭존 (.xlsx)
- 클라이언트에서 SheetJS로 1차 파싱 → 미리보기(상위 10행 + 총 행 수)
- "업로드 실행" 클릭 → 비밀번호 모달 → 서버에서 재파싱 + 검증 + Upsert (트랜잭션)
- 결과: 신규 N건 / 갱신 M건 / 스킵 K건. 에러 행은 사유와 함께 표 + CSV 다운로드

### 6.4 `/quality/stats` 통계 (탭 3개)

**탭 1 — 원인 랭킹 (메인)**
- 입력: 모델명 combobox(필수), 부적합내용 combobox(필수, 모델 선택 시 옵션이 그 모델에서 나온 항목으로 좁혀짐)
- 결과:
  - 좌측: 요약 카드 (총 건수, 기간, 고유 원인 수)
  - 우측 위: 원인 랭킹 테이블 (순위 / 원인 / 건수 / 비중 % / 인라인 막대 게이지). 행 클릭 → 해당 조건의 리스트로 이동
  - 우측 아래: 조치사항 랭킹 (보조)
- 한쪽만 입력 시: 모델만 → 부적합내용 랭킹 / 부적합내용만 → 모델 랭킹 (폴백)

**탭 2 — 모델 대시보드**
- 모델 선택 시: 카드 4개(총건수/최근30일/고유 LOT 수/최다 부적합 내용), 월별 추이 라인차트(최근 12개월), 부적합 내용 TOP 5, 부적합 원인 TOP 5, 최근 이력 10건

**탭 3 — 전사 대시보드**
- 카드 4개(전체 건수/최근30일/모델 수/등록자 수), 부적합 많은 모델 TOP 10, 원인 TOP 10, 월별 추이, 소스 비율 도넛(엑셀 vs 수기)

### 6.5 `/quality/[nc_no]` 상세
- 모든 필드 표시. `수정` 버튼(인라인 폼 전환), `삭제` 버튼(확인 모달 → 비밀번호 모달)

## 7. Excel Import 상세

- 시트 선택: `부적합품 관리 대장` 우선, 없으면 첫 번째 시트
- 헤더 행 탐지: 셀 값에 `부적합품` 또는 `NC` 포함 셀이 있는 행을 헤더로 사용
- 컬럼 매핑(공백/대소문자 무시, 부분 일치):
  - `부적합품 번호` → `nc_no`
  - `작성일자` → `written_date`
  - `모델명` → `model_name`
  - `LOT 번호` → `lot_no`
  - `부적합 내용` → `defect`
  - `부적합 원인` → `cause`
  - `조치사항` → `action`
  - `처리결과` → `result`
  - `처리자` → `handler`
- 행 검증: 필수 누락 / 날짜 파싱 실패 → 해당 행 스킵 + 에러 리포트, 정상 행은 계속
- WNC 패턴 nc_no가 엑셀에 있어도 정상 처리(소스를 강제로 'excel'로 기록하지 않고, 그대로 nc_no 유지하되 기존 행 수정 방식)

## 8. 비기능 요구사항

- 1300+ 건 규모, 향후 1만건 이하 가정. SQLite 인덱스로 대응 충분.
- 단일 인스턴스 가정 (다중 인스턴스 동시 쓰기 시나리오 없음)
- 한국어 UI
- 기존 디자인 시스템(Tailwind, navy/accent-blue 컬러)과 일관

## 9. 테스트

- **유닛**: 날짜 정규화 (4가지 포맷), nc_no 자동 채번
- **통합**: in-memory SQLite로 Upsert(신규/갱신), 검색 필터, 통계 집계
- **API**: 비밀번호 헤더 정상/오답/누락 (timing-safe 비교)

## 10. 보안 / 운영

- `data/quality.db`, `.env.local`은 `.gitignore`
- `QUALITY_ADMIN_PASSWORD` 미설정 시 변경 계열 API는 503 응답 + 가이드 메시지
- 변경 API는 모두 비밀번호 헤더 필수, 헤더 누락/오답 시 401

## 11. 마일스톤 (대략)

1. SQLite 스키마 + 라이브러리(`better-sqlite3`, `xlsx`, `recharts`) 추가
2. API Routes (CRUD + 옵션 + 통계)
3. `/quality` 검색·리스트 화면
4. `/quality/new` 신규 등록 + 비밀번호 모달
5. `/quality/import` 엑셀 업로드 + 결과 리포트
6. `/quality/stats` 3개 탭
7. `/quality/[nc_no]` 상세/수정/삭제
8. Header 메뉴 추가, 기존 엑셀 데이터로 시드 임포트
