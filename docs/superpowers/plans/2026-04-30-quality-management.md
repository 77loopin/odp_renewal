# 품질관리(부적합품) 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SQLite 기반의 부적합품 등록/검색/엑셀업로드/통계 페이지를 Next.js App Router에 추가한다.

**Architecture:** Next.js Route Handlers가 `better-sqlite3`로 `data/quality.db`에 직접 접근. 클라이언트는 fetch + sessionStorage로 비밀번호 보관. 통계는 SQL 집계로 계산 후 `recharts`로 시각화.

**Tech Stack:** Next.js 14, TypeScript, Tailwind, `better-sqlite3`, `xlsx` (SheetJS), `recharts`, `vitest` (신규 추가).

**Spec:** `docs/superpowers/specs/2026-04-30-quality-management-design.md`

---

## File Structure

**Backend / 라이브러리**
- `src/lib/quality/db.ts` — SQLite singleton 연결 + 스키마 마이그레이션
- `src/lib/quality/types.ts` — `NonConformance`, `NCFilters`, `Source` 등 TypeScript 타입
- `src/lib/quality/date.ts` — 다양한 입력을 `YYYY-MM-DD`로 정규화
- `src/lib/quality/nc-no.ts` — `WNC` prefix 자동 채번
- `src/lib/quality/auth.ts` — 비밀번호 timing-safe 비교
- `src/lib/quality/repository.ts` — CRUD, 검색, 옵션 쿼리
- `src/lib/quality/stats.ts` — 통계 집계 쿼리
- `src/lib/quality/excel.ts` — 엑셀 파싱·헤더 매핑·검증

**API Routes**
- `src/app/api/quality/route.ts` — `GET` 검색 / `POST` 신규
- `src/app/api/quality/[nc_no]/route.ts` — `GET` / `PATCH` / `DELETE`
- `src/app/api/quality/options/route.ts` — distinct 모델/내용/원인/조치 (자동완성)
- `src/app/api/quality/import/route.ts` — `POST` 엑셀 업로드
- `src/app/api/quality/stats/causes/route.ts` — 원인 랭킹
- `src/app/api/quality/stats/model/route.ts` — 모델 대시보드
- `src/app/api/quality/stats/global/route.ts` — 전사 대시보드

**UI 페이지**
- `src/app/quality/page.tsx` — 검색·리스트
- `src/app/quality/new/page.tsx` — 신규 등록
- `src/app/quality/import/page.tsx` — 엑셀 업로드
- `src/app/quality/stats/page.tsx` — 통계 (탭 3개)
- `src/app/quality/[nc_no]/page.tsx` — 상세/수정/삭제

**UI 컴포넌트**
- `src/components/quality/Combobox.tsx` — 자동완성 + 직접입력
- `src/components/quality/PasswordModal.tsx` — 비밀번호 입력 모달
- `src/components/quality/SourceBadge.tsx` — `엑셀`/`수기` 뱃지
- `src/components/quality/FilterBar.tsx` — 검색 필터 바
- `src/components/quality/NCTable.tsx` — 리스트 테이블 + 페이지네이션
- `src/components/quality/NCForm.tsx` — 등록/수정 공용 폼
- `src/components/quality/CauseRanking.tsx` — 원인 랭킹 표 + 인라인 막대

**스크립트 / 설정**
- `scripts/seed-quality.mjs` — 기존 엑셀로 초기 시드
- `vitest.config.ts` — 유닛 테스트 설정
- `.gitignore` — `data/quality.db`, `.env.local` 추가
- `.env.local.example` — 비밀번호 환경변수 안내

**테스트**
- `tests/lib/quality/date.test.ts`
- `tests/lib/quality/nc-no.test.ts`
- `tests/lib/quality/excel.test.ts`
- `tests/lib/quality/repository.test.ts`

---

## Task 1: 의존성 설치 및 기본 설정

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `.env.local.example`
- Create: `vitest.config.ts`
- Create: `data/.gitkeep`
- Create: `next.config.mjs` (수정 — `serverExternalPackages` 추가)

- [ ] **Step 1: 패키지 설치**

```bash
pnpm add better-sqlite3 xlsx recharts
pnpm add -D @types/better-sqlite3 vitest @vitest/ui happy-dom
```

- [ ] **Step 2: `.gitignore` 갱신**

`.gitignore`에 다음 라인을 추가:

```
.env.local
data/quality.db
data/quality.db-journal
data/quality.db-wal
data/quality.db-shm
```

- [ ] **Step 3: `data/.gitkeep` 생성**

빈 파일 `data/.gitkeep`을 만들어 디렉토리를 git에 유지.

- [ ] **Step 4: `.env.local.example` 생성**

```bash
# 변경 계열 API(등록/수정/삭제/엑셀 업로드)에서 요구하는 비밀번호
QUALITY_ADMIN_PASSWORD=change-me
```

- [ ] **Step 5: `next.config.mjs` 수정**

기존 파일에 `serverExternalPackages`를 추가 (better-sqlite3는 Native 모듈이라 번들러가 처리하면 안 됨). 현재 파일을 읽고 다음 형태로 만든다:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
```

- [ ] **Step 6: `vitest.config.ts` 생성**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

- [ ] **Step 7: `package.json` scripts 추가**

`scripts` 섹션에 추가:

```json
"test": "vitest run",
"test:watch": "vitest",
"seed:quality": "node scripts/seed-quality.mjs"
```

- [ ] **Step 8: 빌드/설치 sanity check**

Run: `pnpm install && pnpm test --run` (실패해도 OK — 아직 테스트 없음, "no tests found" 정도)
Run: `pnpm build` — 통과해야 함

- [ ] **Step 9: 커밋**

```bash
git add package.json pnpm-lock.yaml .gitignore .env.local.example data/.gitkeep vitest.config.ts next.config.mjs
git commit -m "chore: 품질관리 기능을 위한 의존성 및 설정 추가

- better-sqlite3, xlsx, recharts 추가
- vitest 테스트 환경 구성
- data/ 디렉토리 + 환경변수 예시 파일"
```

---

## Task 2: 타입 정의

**Files:**
- Create: `src/lib/quality/types.ts`

- [ ] **Step 1: 타입 작성**

```ts
export type Source = "excel" | "web";

export interface NonConformance {
  id: number;
  nc_no: string;
  source: Source;
  written_date: string; // YYYY-MM-DD
  model_name: string;
  lot_no: string | null;
  defect: string;
  cause: string | null;
  action: string | null;
  result: string | null;
  handler: string | null;
  created_at: string;
  updated_at: string;
}

export interface NCInput {
  written_date: string;
  model_name: string;
  lot_no?: string | null;
  defect: string;
  cause?: string | null;
  action?: string | null;
  result?: string | null;
  handler?: string | null;
}

export interface NCFilters {
  q?: string;
  model?: string;
  defect?: string;
  cause?: string;
  action?: string;
  lot?: string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  source?: Source;
  page?: number;
  pageSize?: number;
  sort?: "date_desc" | "date_asc" | "nc_desc" | "nc_asc" | "model_asc";
}

export interface NCListResult {
  rows: NonConformance[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/quality/types.ts
git commit -m "feat(quality): 부적합품 타입 정의"
```

---

## Task 3: 날짜 정규화 모듈 (TDD)

**Files:**
- Create: `tests/lib/quality/date.test.ts`
- Create: `src/lib/quality/date.ts`

- [ ] **Step 1: 실패 테스트 작성**

`tests/lib/quality/date.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normalizeDate } from "@/lib/quality/date";

describe("normalizeDate", () => {
  it("dot-separated", () => {
    expect(normalizeDate("2025.01.02")).toBe("2025-01-02");
    expect(normalizeDate("2025.1.2")).toBe("2025-01-02");
  });
  it("slash-separated", () => {
    expect(normalizeDate("2025/01/02")).toBe("2025-01-02");
    expect(normalizeDate("2025/1/2")).toBe("2025-01-02");
  });
  it("dash-separated (already ISO)", () => {
    expect(normalizeDate("2025-01-02")).toBe("2025-01-02");
  });
  it("Date object", () => {
    expect(normalizeDate(new Date("2025-01-02T09:00:00Z"))).toBe("2025-01-02");
  });
  it("Excel serial number", () => {
    // 45659 = 2025-01-02
    expect(normalizeDate(45659)).toBe("2025-01-02");
  });
  it("trims whitespace", () => {
    expect(normalizeDate("  2025.01.02  ")).toBe("2025-01-02");
  });
  it("returns null for invalid", () => {
    expect(normalizeDate("not a date")).toBeNull();
    expect(normalizeDate("")).toBeNull();
    expect(normalizeDate(null)).toBeNull();
    expect(normalizeDate(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test --run`
Expected: 모든 테스트 FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/lib/quality/date.ts`:

```ts
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

export function normalizeDate(input: unknown): string | null {
  if (input === null || input === undefined) return null;

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : toIso(input);
  }

  if (typeof input === "number" && Number.isFinite(input)) {
    const ms = EXCEL_EPOCH + Math.round(input) * 86400000;
    return toIso(new Date(ms));
  }

  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return null;
    const m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
    if (m) {
      const [, y, mo, d] = m;
      const yyyy = y;
      const mm = mo.padStart(2, "0");
      const dd = d.padStart(2, "0");
      const date = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
      return isNaN(date.getTime()) ? null : `${yyyy}-${mm}-${dd}`;
    }
    return null;
  }

  return null;
}

function toIso(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test --run tests/lib/quality/date.test.ts`
Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add tests/lib/quality/date.test.ts src/lib/quality/date.ts
git commit -m "feat(quality): 날짜 정규화 유틸 + 테스트"
```

---

## Task 4: SQLite 연결 및 스키마

**Files:**
- Create: `src/lib/quality/db.ts`

- [ ] **Step 1: db 모듈 작성**

```ts
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = process.env.QUALITY_DB_PATH || path.join(dataDir, "quality.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  _db = db;
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS non_conformance (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nc_no         TEXT    NOT NULL UNIQUE,
      source        TEXT    NOT NULL CHECK(source IN ('excel','web')),
      written_date  TEXT    NOT NULL,
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
    CREATE INDEX IF NOT EXISTS idx_nc_model        ON non_conformance(model_name);
    CREATE INDEX IF NOT EXISTS idx_nc_date         ON non_conformance(written_date);
    CREATE INDEX IF NOT EXISTS idx_nc_model_defect ON non_conformance(model_name, defect);
    CREATE INDEX IF NOT EXISTS idx_nc_lot          ON non_conformance(lot_no);
  `);
}
```

- [ ] **Step 2: 빌드 검증**

Run: `pnpm build`
Expected: 성공 (이 모듈은 아직 import되지 않으므로 단순 컴파일 통과만 확인)

- [ ] **Step 3: 커밋**

```bash
git add src/lib/quality/db.ts
git commit -m "feat(quality): SQLite 연결 및 마이그레이션"
```

---

## Task 5: NC 번호 채번 (TDD)

**Files:**
- Create: `tests/lib/quality/nc-no.test.ts`
- Create: `src/lib/quality/nc-no.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { generateWebNcNo } from "@/lib/quality/nc-no";

function makeDb() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE non_conformance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nc_no TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL,
      written_date TEXT NOT NULL,
      model_name TEXT NOT NULL,
      defect TEXT NOT NULL
    );
  `);
  return db;
}

describe("generateWebNcNo", () => {
  it("첫 번호는 WNC{YY}00001", () => {
    const db = makeDb();
    expect(generateWebNcNo(db, 2026)).toBe("WNC2600001");
  });

  it("기존 WNC 번호의 다음 값으로 증가", () => {
    const db = makeDb();
    db.prepare(`INSERT INTO non_conformance (nc_no, source, written_date, model_name, defect)
                VALUES ('WNC2600003', 'web', '2026-01-01', 'M', 'D')`).run();
    expect(generateWebNcNo(db, 2026)).toBe("WNC2600004");
  });

  it("다른 연도 prefix는 영향 없음", () => {
    const db = makeDb();
    db.prepare(`INSERT INTO non_conformance (nc_no, source, written_date, model_name, defect)
                VALUES ('WNC2599999', 'web', '2025-01-01', 'M', 'D')`).run();
    expect(generateWebNcNo(db, 2026)).toBe("WNC2600001");
  });

  it("excel prefix(NC...)는 무시", () => {
    const db = makeDb();
    db.prepare(`INSERT INTO non_conformance (nc_no, source, written_date, model_name, defect)
                VALUES ('NC2699999', 'excel', '2026-01-01', 'M', 'D')`).run();
    expect(generateWebNcNo(db, 2026)).toBe("WNC2600001");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test --run tests/lib/quality/nc-no.test.ts`
Expected: FAIL ("Cannot find module nc-no")

- [ ] **Step 3: 구현**

`src/lib/quality/nc-no.ts`:

```ts
import type Database from "better-sqlite3";

export function generateWebNcNo(db: Database.Database, year?: number): string {
  const yy = String((year ?? new Date().getFullYear()) % 100).padStart(2, "0");
  const prefix = `WNC${yy}`;
  const row = db
    .prepare(
      `SELECT nc_no FROM non_conformance
         WHERE nc_no LIKE ?
         ORDER BY nc_no DESC LIMIT 1`,
    )
    .get(`${prefix}%`) as { nc_no: string } | undefined;
  let next = 1;
  if (row) {
    const tail = row.nc_no.slice(prefix.length);
    const n = Number.parseInt(tail, 10);
    if (Number.isFinite(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(5, "0")}`;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test --run tests/lib/quality/nc-no.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add tests/lib/quality/nc-no.test.ts src/lib/quality/nc-no.ts
git commit -m "feat(quality): WNC 번호 자동 채번 + 테스트"
```

---

## Task 6: 비밀번호 검증

**Files:**
- Create: `src/lib/quality/auth.ts`

- [ ] **Step 1: 구현**

```ts
import { timingSafeEqual } from "node:crypto";

export class PasswordError extends Error {
  constructor(public status: 401 | 503, message: string) {
    super(message);
  }
}

export function verifyPassword(headerValue: string | null | undefined): void {
  const expected = process.env.QUALITY_ADMIN_PASSWORD;
  if (!expected) {
    throw new PasswordError(
      503,
      "QUALITY_ADMIN_PASSWORD 환경변수가 설정되지 않았습니다. .env.local에 추가해 주세요.",
    );
  }
  if (!headerValue) {
    throw new PasswordError(401, "비밀번호가 필요합니다.");
  }
  const a = Buffer.from(headerValue);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new PasswordError(401, "비밀번호가 올바르지 않습니다.");
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/quality/auth.ts
git commit -m "feat(quality): 비밀번호 timing-safe 검증"
```

---

## Task 7: Repository (CRUD + 검색 + 옵션)

**Files:**
- Create: `src/lib/quality/repository.ts`

- [ ] **Step 1: 구현**

```ts
import type Database from "better-sqlite3";
import { getDb } from "./db";
import { generateWebNcNo } from "./nc-no";
import type {
  NonConformance,
  NCInput,
  NCFilters,
  NCListResult,
  Source,
} from "./types";

const COLUMNS =
  "id, nc_no, source, written_date, model_name, lot_no, defect, cause, action, result, handler, created_at, updated_at";

const SORT_MAP: Record<NonNullable<NCFilters["sort"]>, string> = {
  date_desc: "written_date DESC, nc_no DESC",
  date_asc: "written_date ASC, nc_no ASC",
  nc_desc: "nc_no DESC",
  nc_asc: "nc_no ASC",
  model_asc: "model_name ASC, written_date DESC",
};

function buildWhere(f: NCFilters): { sql: string; params: unknown[] } {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.q) {
    where.push(
      `(model_name LIKE ? OR lot_no LIKE ? OR defect LIKE ? OR cause LIKE ? OR action LIKE ? OR result LIKE ? OR handler LIKE ? OR nc_no LIKE ?)`,
    );
    const like = `%${f.q}%`;
    for (let i = 0; i < 8; i++) params.push(like);
  }
  if (f.model) { where.push("model_name = ?"); params.push(f.model); }
  if (f.defect) { where.push("defect = ?"); params.push(f.defect); }
  if (f.cause) { where.push("cause = ?"); params.push(f.cause); }
  if (f.action) { where.push("action = ?"); params.push(f.action); }
  if (f.lot) { where.push("lot_no LIKE ?"); params.push(`%${f.lot}%`); }
  if (f.from) { where.push("written_date >= ?"); params.push(f.from); }
  if (f.to) { where.push("written_date <= ?"); params.push(f.to); }
  if (f.source) { where.push("source = ?"); params.push(f.source); }
  return {
    sql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

export function listNC(filters: NCFilters, db: Database.Database = getDb()): NCListResult {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(500, Math.max(10, filters.pageSize ?? 50));
  const offset = (page - 1) * pageSize;
  const sort = SORT_MAP[filters.sort ?? "date_desc"];
  const { sql: whereSql, params } = buildWhere(filters);

  const rows = db
    .prepare(
      `SELECT ${COLUMNS} FROM non_conformance ${whereSql} ORDER BY ${sort} LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset) as NonConformance[];

  const totalRow = db
    .prepare(`SELECT COUNT(*) as c FROM non_conformance ${whereSql}`)
    .get(...params) as { c: number };

  return { rows, total: totalRow.c, page, pageSize };
}

export function getNC(nc_no: string, db: Database.Database = getDb()): NonConformance | null {
  const row = db
    .prepare(`SELECT ${COLUMNS} FROM non_conformance WHERE nc_no = ?`)
    .get(nc_no) as NonConformance | undefined;
  return row ?? null;
}

export function createWebNC(
  input: NCInput,
  db: Database.Database = getDb(),
): NonConformance {
  return db.transaction((): NonConformance => {
    const yy = Number(input.written_date.slice(0, 4));
    const nc_no = generateWebNcNo(db, isNaN(yy) ? new Date().getFullYear() : yy);
    db.prepare(
      `INSERT INTO non_conformance
         (nc_no, source, written_date, model_name, lot_no, defect, cause, action, result, handler)
       VALUES (?, 'web', ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      nc_no,
      input.written_date,
      input.model_name,
      input.lot_no ?? null,
      input.defect,
      input.cause ?? null,
      input.action ?? null,
      input.result ?? null,
      input.handler ?? null,
    );
    return getNC(nc_no, db) as NonConformance;
  })();
}

export function updateNC(
  nc_no: string,
  input: NCInput,
  db: Database.Database = getDb(),
): NonConformance | null {
  const existing = getNC(nc_no, db);
  if (!existing) return null;
  db.prepare(
    `UPDATE non_conformance SET
       written_date = ?, model_name = ?, lot_no = ?, defect = ?,
       cause = ?, action = ?, result = ?, handler = ?,
       updated_at = datetime('now')
     WHERE nc_no = ?`,
  ).run(
    input.written_date,
    input.model_name,
    input.lot_no ?? null,
    input.defect,
    input.cause ?? null,
    input.action ?? null,
    input.result ?? null,
    input.handler ?? null,
    nc_no,
  );
  return getNC(nc_no, db);
}

export function deleteNC(nc_no: string, db: Database.Database = getDb()): boolean {
  const info = db.prepare(`DELETE FROM non_conformance WHERE nc_no = ?`).run(nc_no);
  return info.changes > 0;
}

export interface UpsertExcelRow extends NCInput {
  nc_no: string;
  source: Source;
}

export function upsertExcelRows(
  rows: UpsertExcelRow[],
  db: Database.Database = getDb(),
): { inserted: number; updated: number } {
  const stmt = db.prepare(
    `INSERT INTO non_conformance
       (nc_no, source, written_date, model_name, lot_no, defect, cause, action, result, handler)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(nc_no) DO UPDATE SET
       written_date = excluded.written_date,
       model_name   = excluded.model_name,
       lot_no       = excluded.lot_no,
       defect       = excluded.defect,
       cause        = excluded.cause,
       action       = excluded.action,
       result       = excluded.result,
       handler      = excluded.handler,
       updated_at   = datetime('now')
     RETURNING (SELECT COUNT(*) FROM non_conformance WHERE nc_no = excluded.nc_no AND created_at = updated_at) AS is_new`,
  );

  let inserted = 0;
  let updated = 0;
  const tx = db.transaction((batch: UpsertExcelRow[]) => {
    for (const r of batch) {
      const before = db
        .prepare(`SELECT 1 FROM non_conformance WHERE nc_no = ?`)
        .get(r.nc_no);
      stmt.run(
        r.nc_no,
        r.source,
        r.written_date,
        r.model_name,
        r.lot_no ?? null,
        r.defect,
        r.cause ?? null,
        r.action ?? null,
        r.result ?? null,
        r.handler ?? null,
      );
      if (before) updated++;
      else inserted++;
    }
  });
  tx(rows);
  return { inserted, updated };
}

export interface OptionSet {
  models: string[];
  defects: string[];
  causes: string[];
  actions: string[];
  handlers: string[];
}

export function getOptions(
  scope: { model?: string } = {},
  db: Database.Database = getDb(),
): OptionSet {
  const params = scope.model ? [scope.model] : [];
  const all = (col: string): string[] => {
    const sql = scope.model
      ? `SELECT DISTINCT ${col} as v FROM non_conformance WHERE model_name = ? AND ${col} IS NOT NULL AND ${col} != '' ORDER BY v`
      : `SELECT DISTINCT ${col} as v FROM non_conformance WHERE ${col} IS NOT NULL AND ${col} != '' ORDER BY v`;
    return (db.prepare(sql).all(...params) as { v: string }[]).map((r) => r.v);
  };
  return {
    models: scope.model
      ? [scope.model]
      : (db.prepare(`SELECT DISTINCT model_name as v FROM non_conformance ORDER BY v`).all() as { v: string }[]).map((r) => r.v),
    defects: all("defect"),
    causes: all("cause"),
    actions: all("action"),
    handlers: all("handler"),
  };
}
```

- [ ] **Step 2: 테스트 작성**

`tests/lib/quality/repository.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import {
  listNC,
  getNC,
  createWebNC,
  updateNC,
  deleteNC,
  upsertExcelRows,
  getOptions,
} from "@/lib/quality/repository";

function makeDb() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE non_conformance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nc_no TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL CHECK(source IN ('excel','web')),
      written_date TEXT NOT NULL,
      model_name TEXT NOT NULL,
      lot_no TEXT,
      defect TEXT NOT NULL,
      cause TEXT,
      action TEXT,
      result TEXT,
      handler TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

describe("repository", () => {
  let db: ReturnType<typeof makeDb>;
  beforeEach(() => { db = makeDb(); });

  it("createWebNC + getNC", () => {
    const created = createWebNC(
      { written_date: "2026-04-30", model_name: "SDS6-24-12", defect: "출력없음" },
      db,
    );
    expect(created.nc_no).toMatch(/^WNC26\d{5}$/);
    expect(getNC(created.nc_no, db)?.model_name).toBe("SDS6-24-12");
  });

  it("listNC filters by model + defect + date range", () => {
    upsertExcelRows(
      [
        { nc_no: "NC2600001", source: "excel", written_date: "2026-01-02", model_name: "A", defect: "D1", cause: "C1" },
        { nc_no: "NC2600002", source: "excel", written_date: "2026-02-02", model_name: "A", defect: "D2", cause: "C2" },
        { nc_no: "NC2600003", source: "excel", written_date: "2026-03-02", model_name: "B", defect: "D1", cause: "C1" },
      ],
      db,
    );
    const r = listNC({ model: "A", defect: "D1" }, db);
    expect(r.total).toBe(1);
    expect(r.rows[0].nc_no).toBe("NC2600001");
    const r2 = listNC({ from: "2026-02-01", to: "2026-12-31" }, db);
    expect(r2.total).toBe(2);
  });

  it("upsertExcelRows: 새로 삽입한 뒤 같은 nc_no로 다시 호출하면 갱신", () => {
    upsertExcelRows(
      [{ nc_no: "NC2600001", source: "excel", written_date: "2026-01-01", model_name: "A", defect: "D" }],
      db,
    );
    const res = upsertExcelRows(
      [{ nc_no: "NC2600001", source: "excel", written_date: "2026-01-01", model_name: "A", defect: "Dchanged", cause: "X" }],
      db,
    );
    expect(res.inserted).toBe(0);
    expect(res.updated).toBe(1);
    expect(getNC("NC2600001", db)?.defect).toBe("Dchanged");
  });

  it("updateNC + deleteNC", () => {
    const c = createWebNC(
      { written_date: "2026-04-30", model_name: "M", defect: "D" }, db,
    );
    const updated = updateNC(c.nc_no, { written_date: "2026-04-30", model_name: "M", defect: "D2" }, db);
    expect(updated?.defect).toBe("D2");
    expect(deleteNC(c.nc_no, db)).toBe(true);
    expect(getNC(c.nc_no, db)).toBeNull();
  });

  it("getOptions returns sorted distinct values", () => {
    upsertExcelRows(
      [
        { nc_no: "NC2600001", source: "excel", written_date: "2026-01-01", model_name: "B", defect: "Z", cause: "c2" },
        { nc_no: "NC2600002", source: "excel", written_date: "2026-01-02", model_name: "A", defect: "Y", cause: "c1" },
      ],
      db,
    );
    const o = getOptions({}, db);
    expect(o.models).toEqual(["A", "B"]);
    expect(o.defects).toEqual(["Y", "Z"]);
    expect(o.causes).toEqual(["c1", "c2"]);
  });
});
```

- [ ] **Step 3: 테스트 실행**

Run: `pnpm test --run tests/lib/quality/repository.test.ts`
Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add src/lib/quality/repository.ts tests/lib/quality/repository.test.ts
git commit -m "feat(quality): repository (CRUD/검색/upsert/옵션) + 테스트"
```

---

## Task 8: Stats 집계 모듈

**Files:**
- Create: `src/lib/quality/stats.ts`

- [ ] **Step 1: 구현**

```ts
import type Database from "better-sqlite3";
import { getDb } from "./db";

export interface Ranked {
  key: string;
  count: number;
  percent: number;
}

export interface CauseRankingResult {
  total: number;
  range: { from: string | null; to: string | null };
  causes: Ranked[];
  actions: Ranked[];
}

function rank(rows: { v: string | null; c: number }[], total: number): Ranked[] {
  return rows
    .filter((r) => r.v && r.v.trim().length > 0)
    .map((r) => ({
      key: r.v as string,
      count: r.c,
      percent: total > 0 ? Math.round((r.c / total) * 1000) / 10 : 0,
    }));
}

export function getCauseRanking(
  filter: { model?: string; defect?: string },
  db: Database.Database = getDb(),
): CauseRankingResult {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.model) { where.push("model_name = ?"); params.push(filter.model); }
  if (filter.defect) { where.push("defect = ?"); params.push(filter.defect); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalRow = db.prepare(
    `SELECT COUNT(*) c, MIN(written_date) f, MAX(written_date) t FROM non_conformance ${whereSql}`,
  ).get(...params) as { c: number; f: string | null; t: string | null };

  const causeRows = db.prepare(
    `SELECT cause v, COUNT(*) c FROM non_conformance ${whereSql}
     GROUP BY cause ORDER BY c DESC`,
  ).all(...params) as { v: string | null; c: number }[];

  const actionRows = db.prepare(
    `SELECT action v, COUNT(*) c FROM non_conformance ${whereSql}
     GROUP BY action ORDER BY c DESC`,
  ).all(...params) as { v: string | null; c: number }[];

  return {
    total: totalRow.c,
    range: { from: totalRow.f, to: totalRow.t },
    causes: rank(causeRows, totalRow.c),
    actions: rank(actionRows, totalRow.c),
  };
}

export interface ModelDashboard {
  model: string;
  total: number;
  recent30: number;
  uniqueLots: number;
  topDefect: string | null;
  monthly: { month: string; count: number }[];
  topDefects: Ranked[];
  topCauses: Ranked[];
  recentRows: { nc_no: string; written_date: string; defect: string; cause: string | null }[];
}

export function getModelDashboard(
  model: string,
  db: Database.Database = getDb(),
): ModelDashboard {
  const total = (db.prepare(`SELECT COUNT(*) c FROM non_conformance WHERE model_name = ?`).get(model) as { c: number }).c;
  const recent30 = (db.prepare(
    `SELECT COUNT(*) c FROM non_conformance WHERE model_name = ? AND written_date >= date('now','-30 days')`,
  ).get(model) as { c: number }).c;
  const uniqueLots = (db.prepare(
    `SELECT COUNT(DISTINCT lot_no) c FROM non_conformance WHERE model_name = ? AND lot_no IS NOT NULL`,
  ).get(model) as { c: number }).c;
  const topDefectRow = db.prepare(
    `SELECT defect v FROM non_conformance WHERE model_name = ? GROUP BY defect ORDER BY COUNT(*) DESC LIMIT 1`,
  ).get(model) as { v: string } | undefined;

  const monthly = (db.prepare(
    `SELECT substr(written_date,1,7) m, COUNT(*) c FROM non_conformance
     WHERE model_name = ? AND written_date >= date('now','-12 months')
     GROUP BY m ORDER BY m`,
  ).all(model) as { m: string; c: number }[]).map((r) => ({ month: r.m, count: r.c }));

  const topDefectsRows = db.prepare(
    `SELECT defect v, COUNT(*) c FROM non_conformance WHERE model_name = ?
     GROUP BY defect ORDER BY c DESC LIMIT 5`,
  ).all(model) as { v: string; c: number }[];

  const topCausesRows = db.prepare(
    `SELECT cause v, COUNT(*) c FROM non_conformance
     WHERE model_name = ? AND cause IS NOT NULL AND cause != ''
     GROUP BY cause ORDER BY c DESC LIMIT 5`,
  ).all(model) as { v: string; c: number }[];

  const recentRows = db.prepare(
    `SELECT nc_no, written_date, defect, cause FROM non_conformance
     WHERE model_name = ? ORDER BY written_date DESC, nc_no DESC LIMIT 10`,
  ).all(model) as { nc_no: string; written_date: string; defect: string; cause: string | null }[];

  return {
    model,
    total,
    recent30,
    uniqueLots,
    topDefect: topDefectRow?.v ?? null,
    monthly,
    topDefects: rank(topDefectsRows, total),
    topCauses: rank(topCausesRows, total),
    recentRows,
  };
}

export interface GlobalDashboard {
  total: number;
  recent30: number;
  modelCount: number;
  handlerCount: number;
  topModels: Ranked[];
  topCauses: Ranked[];
  monthly: { month: string; count: number }[];
  sourceRatio: { source: "excel" | "web"; count: number }[];
}

export function getGlobalDashboard(db: Database.Database = getDb()): GlobalDashboard {
  const total = (db.prepare(`SELECT COUNT(*) c FROM non_conformance`).get() as { c: number }).c;
  const recent30 = (db.prepare(
    `SELECT COUNT(*) c FROM non_conformance WHERE written_date >= date('now','-30 days')`,
  ).get() as { c: number }).c;
  const modelCount = (db.prepare(`SELECT COUNT(DISTINCT model_name) c FROM non_conformance`).get() as { c: number }).c;
  const handlerCount = (db.prepare(
    `SELECT COUNT(DISTINCT handler) c FROM non_conformance WHERE handler IS NOT NULL AND handler != ''`,
  ).get() as { c: number }).c;

  const topModelsRows = db.prepare(
    `SELECT model_name v, COUNT(*) c FROM non_conformance GROUP BY model_name ORDER BY c DESC LIMIT 10`,
  ).all() as { v: string; c: number }[];

  const topCausesRows = db.prepare(
    `SELECT cause v, COUNT(*) c FROM non_conformance
     WHERE cause IS NOT NULL AND cause != '' GROUP BY cause ORDER BY c DESC LIMIT 10`,
  ).all() as { v: string; c: number }[];

  const monthly = (db.prepare(
    `SELECT substr(written_date,1,7) m, COUNT(*) c FROM non_conformance
     WHERE written_date >= date('now','-12 months')
     GROUP BY m ORDER BY m`,
  ).all() as { m: string; c: number }[]).map((r) => ({ month: r.m, count: r.c }));

  const sourceRatio = db.prepare(
    `SELECT source, COUNT(*) count FROM non_conformance GROUP BY source`,
  ).all() as { source: "excel" | "web"; count: number }[];

  return {
    total,
    recent30,
    modelCount,
    handlerCount,
    topModels: rank(topModelsRows, total),
    topCauses: rank(topCausesRows, total),
    monthly,
    sourceRatio,
  };
}
```

- [ ] **Step 2: 빌드 확인**

Run: `pnpm build`
Expected: 성공

- [ ] **Step 3: 커밋**

```bash
git add src/lib/quality/stats.ts
git commit -m "feat(quality): 통계 집계(원인 랭킹/모델 대시보드/전사 대시보드)"
```

---

## Task 9: 엑셀 파싱 모듈 (TDD)

**Files:**
- Create: `tests/lib/quality/excel.test.ts`
- Create: `src/lib/quality/excel.ts`
- Create: `tests/fixtures/sample.xlsx` (작은 샘플 — 코드로 만든다)

- [ ] **Step 1: 픽스처 생성 스크립트 (1회용)**

`tests/fixtures` 디렉토리를 만들고 다음 명령으로 샘플 엑셀을 생성:

```bash
mkdir -p tests/fixtures
node -e "
const XLSX = require('xlsx');
const ws = XLSX.utils.aoa_to_sheet([
  ['부 적 합 품 관 리 대 장'],
  ['부적합품 번호','작성일자','모델명','LOT 번호','부적합 내용','부적합 원인','조치사항','처리결과','처리자'],
  ['NC260001','2026.01.02','SDS1R5-24-12','S224L1791','출력없음','F1불량','부품교체',null,null],
  ['NC260002','2026/01/02','SDS1R5-24-12','S224L1791','출력없음','F1불량','부품교체',null,null],
  ['NC260003','badDate','SDS1R5-24-12','S224L1791','출력없음','F1불량','부품교체',null,null],
  ['NC260004','2026-01-02','SDS1R5-24-05',null,'출력높음','IC1불량','부품교체',null,null],
]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '부적합품 관리 대장');
XLSX.writeFile(wb, 'tests/fixtures/sample.xlsx');
"
```

- [ ] **Step 2: 실패 테스트 작성**

`tests/lib/quality/excel.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseExcel } from "@/lib/quality/excel";

const fixturePath = path.join(process.cwd(), "tests/fixtures/sample.xlsx");

describe("parseExcel", () => {
  it("정상 행을 파싱하고 다양한 날짜 포맷을 정규화", () => {
    const buf = fs.readFileSync(fixturePath);
    const r = parseExcel(buf);
    expect(r.rows.length).toBe(3);                 // bad date 행 제외
    expect(r.errors.length).toBe(1);
    expect(r.errors[0].reason).toMatch(/날짜/);
    expect(r.rows.every((x) => x.written_date === "2026-01-02")).toBe(true);
    expect(r.rows[0].nc_no).toBe("NC260001");
    expect(r.rows[0].source).toBe("excel");
  });

  it("LOT/원인 등 NULL 값 허용", () => {
    const buf = fs.readFileSync(fixturePath);
    const r = parseExcel(buf);
    const row = r.rows.find((x) => x.nc_no === "NC260004")!;
    expect(row.lot_no).toBeNull();
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `pnpm test --run tests/lib/quality/excel.test.ts`
Expected: FAIL ("Cannot find module excel")

- [ ] **Step 4: 구현**

`src/lib/quality/excel.ts`:

```ts
import * as XLSX from "xlsx";
import { normalizeDate } from "./date";
import type { UpsertExcelRow } from "./repository";

const TARGET_SHEET = "부적합품 관리 대장";

const FIELD_ALIASES: Record<keyof UpsertExcelRow, string[]> = {
  nc_no: ["부적합품번호", "부적합품 번호", "NC번호", "NC No"],
  source: [],
  written_date: ["작성일자", "일자", "날짜"],
  model_name: ["모델명", "모델", "Model"],
  lot_no: ["LOT번호", "LOT 번호", "LOT", "Lot"],
  defect: ["부적합내용", "부적합 내용", "내용", "증상"],
  cause: ["부적합원인", "부적합 원인", "원인"],
  action: ["조치사항", "조치 사항", "조치"],
  result: ["처리결과", "결과"],
  handler: ["처리자", "담당자"],
};

const norm = (s: unknown) => String(s ?? "").replace(/\s+/g, "").toLowerCase();

function pickHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] || [];
    const joined = row.map((c) => norm(c)).join("|");
    if (joined.includes("부적합품") || joined.includes("nc번호") || joined.includes("ncno")) {
      return i;
    }
  }
  return -1;
}

function buildColumnMap(headerRow: unknown[]): Partial<Record<keyof UpsertExcelRow, number>> {
  const map: Partial<Record<keyof UpsertExcelRow, number>> = {};
  headerRow.forEach((cell, idx) => {
    const n = norm(cell);
    if (!n) return;
    for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [keyof UpsertExcelRow, string[]][]) {
      if (field === "source") continue;
      if (aliases.some((a) => norm(a) === n) || aliases.some((a) => n.includes(norm(a)))) {
        if (map[field] === undefined) map[field] = idx;
      }
    }
  });
  return map;
}

export interface ParseExcelResult {
  rows: UpsertExcelRow[];
  errors: { row: number; reason: string }[];
}

export function parseExcel(buf: Buffer | ArrayBuffer): ParseExcelResult {
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  const sheetName = wb.SheetNames.includes(TARGET_SHEET) ? TARGET_SHEET : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null, raw: true });

  const headerIdx = pickHeaderRow(aoa);
  if (headerIdx < 0) {
    return { rows: [], errors: [{ row: 0, reason: "헤더 행을 찾을 수 없습니다." }] };
  }
  const colMap = buildColumnMap(aoa[headerIdx]);
  const required: (keyof UpsertExcelRow)[] = ["nc_no", "written_date", "model_name", "defect"];
  for (const f of required) {
    if (colMap[f] === undefined) {
      return { rows: [], errors: [{ row: headerIdx + 1, reason: `필수 컬럼(${f}) 매핑 실패` }] };
    }
  }

  const rows: UpsertExcelRow[] = [];
  const errors: { row: number; reason: string }[] = [];
  const cell = (r: unknown[], k: keyof UpsertExcelRow): unknown => {
    const idx = colMap[k];
    if (idx === undefined) return null;
    const v = r[idx];
    return v === "" ? null : v;
  };

  for (let i = headerIdx + 1; i < aoa.length; i++) {
    const r = aoa[i] || [];
    const rowNumber = i + 1; // 1-indexed for users

    const nc_no = String(cell(r, "nc_no") ?? "").trim();
    const dateRaw = cell(r, "written_date");
    const model_name = String(cell(r, "model_name") ?? "").trim();
    const defect = String(cell(r, "defect") ?? "").trim();

    if (!nc_no && !model_name && !defect && !dateRaw) continue; // empty row

    if (!nc_no) { errors.push({ row: rowNumber, reason: "부적합품 번호 누락" }); continue; }
    const written_date = normalizeDate(dateRaw);
    if (!written_date) { errors.push({ row: rowNumber, reason: `작성일자 파싱 실패 (${dateRaw ?? ""})` }); continue; }
    if (!model_name) { errors.push({ row: rowNumber, reason: "모델명 누락" }); continue; }
    if (!defect)     { errors.push({ row: rowNumber, reason: "부적합 내용 누락" }); continue; }

    rows.push({
      nc_no,
      source: "excel",
      written_date,
      model_name,
      lot_no: textOrNull(cell(r, "lot_no")),
      defect,
      cause: textOrNull(cell(r, "cause")),
      action: textOrNull(cell(r, "action")),
      result: textOrNull(cell(r, "result")),
      handler: textOrNull(cell(r, "handler")),
    });
  }
  return { rows, errors };
}

function textOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm test --run tests/lib/quality/excel.test.ts`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add src/lib/quality/excel.ts tests/lib/quality/excel.test.ts tests/fixtures/sample.xlsx
git commit -m "feat(quality): 엑셀 파싱(헤더 매핑/날짜 정규화/검증) + 테스트"
```

---

## Task 10: API Route — `/api/quality` (검색 + 신규)

**Files:**
- Create: `src/app/api/quality/route.ts`

- [ ] **Step 1: 구현**

```ts
import { NextRequest, NextResponse } from "next/server";
import { listNC, createWebNC } from "@/lib/quality/repository";
import { verifyPassword, PasswordError } from "@/lib/quality/auth";
import { normalizeDate } from "@/lib/quality/date";
import type { NCFilters } from "@/lib/quality/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const f: NCFilters = {
    q: sp.get("q") ?? undefined,
    model: sp.get("model") ?? undefined,
    defect: sp.get("defect") ?? undefined,
    cause: sp.get("cause") ?? undefined,
    action: sp.get("action") ?? undefined,
    lot: sp.get("lot") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    source: (sp.get("source") as NCFilters["source"]) ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    sort: (sp.get("sort") as NCFilters["sort"]) ?? undefined,
  };
  return NextResponse.json(listNC(f));
}

export async function POST(req: NextRequest) {
  try {
    verifyPassword(req.headers.get("x-quality-password"));
    const body = await req.json();
    const written_date = normalizeDate(body.written_date);
    if (!written_date) return NextResponse.json({ error: "작성일자가 올바르지 않습니다." }, { status: 400 });
    if (!body.model_name?.trim()) return NextResponse.json({ error: "모델명은 필수입니다." }, { status: 400 });
    if (!body.defect?.trim()) return NextResponse.json({ error: "부적합 내용은 필수입니다." }, { status: 400 });
    const created = createWebNC({
      written_date,
      model_name: body.model_name.trim(),
      lot_no: body.lot_no?.trim() || null,
      defect: body.defect.trim(),
      cause: body.cause?.trim() || null,
      action: body.action?.trim() || null,
      result: body.result?.trim() || null,
      handler: body.handler?.trim() || null,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof PasswordError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
```

- [ ] **Step 2: 빌드 확인**

Run: `pnpm build`
Expected: 성공

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/quality/route.ts
git commit -m "feat(quality): GET/POST /api/quality"
```

---

## Task 11: API Route — `/api/quality/[nc_no]`

**Files:**
- Create: `src/app/api/quality/[nc_no]/route.ts`

- [ ] **Step 1: 구현**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getNC, updateNC, deleteNC } from "@/lib/quality/repository";
import { verifyPassword, PasswordError } from "@/lib/quality/auth";
import { normalizeDate } from "@/lib/quality/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx { params: { nc_no: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const row = getNC(params.nc_no);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    verifyPassword(req.headers.get("x-quality-password"));
    const body = await req.json();
    const written_date = normalizeDate(body.written_date);
    if (!written_date) return NextResponse.json({ error: "작성일자가 올바르지 않습니다." }, { status: 400 });
    if (!body.model_name?.trim()) return NextResponse.json({ error: "모델명은 필수입니다." }, { status: 400 });
    if (!body.defect?.trim()) return NextResponse.json({ error: "부적합 내용은 필수입니다." }, { status: 400 });
    const updated = updateNC(params.nc_no, {
      written_date,
      model_name: body.model_name.trim(),
      lot_no: body.lot_no?.trim() || null,
      defect: body.defect.trim(),
      cause: body.cause?.trim() || null,
      action: body.action?.trim() || null,
      result: body.result?.trim() || null,
      handler: body.handler?.trim() || null,
    });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof PasswordError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    verifyPassword(req.headers.get("x-quality-password"));
    const ok = deleteNC(params.nc_no);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof PasswordError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/api/quality/[nc_no]/route.ts
git commit -m "feat(quality): GET/PATCH/DELETE /api/quality/[nc_no]"
```

---

## Task 12: API Route — `/api/quality/options`

**Files:**
- Create: `src/app/api/quality/options/route.ts`

- [ ] **Step 1: 구현**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getOptions } from "@/lib/quality/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const model = req.nextUrl.searchParams.get("model") ?? undefined;
  return NextResponse.json(getOptions({ model }));
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/api/quality/options/route.ts
git commit -m "feat(quality): GET /api/quality/options"
```

---

## Task 13: API Route — `/api/quality/import`

**Files:**
- Create: `src/app/api/quality/import/route.ts`

- [ ] **Step 1: 구현**

```ts
import { NextRequest, NextResponse } from "next/server";
import { parseExcel } from "@/lib/quality/excel";
import { upsertExcelRows } from "@/lib/quality/repository";
import { verifyPassword, PasswordError } from "@/lib/quality/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    verifyPassword(req.headers.get("x-quality-password"));
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const parsed = parseExcel(buf);
    const { inserted, updated } = parsed.rows.length
      ? upsertExcelRows(parsed.rows)
      : { inserted: 0, updated: 0 };
    return NextResponse.json({
      inserted,
      updated,
      skipped: parsed.errors.length,
      errors: parsed.errors,
      total: parsed.rows.length + parsed.errors.length,
    });
  } catch (e) {
    if (e instanceof PasswordError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/api/quality/import/route.ts
git commit -m "feat(quality): POST /api/quality/import (엑셀 업로드)"
```

---

## Task 14: API Route — Stats 3종

**Files:**
- Create: `src/app/api/quality/stats/causes/route.ts`
- Create: `src/app/api/quality/stats/model/route.ts`
- Create: `src/app/api/quality/stats/global/route.ts`

- [ ] **Step 1: causes**

`src/app/api/quality/stats/causes/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getCauseRanking } from "@/lib/quality/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return NextResponse.json(
    getCauseRanking({
      model: sp.get("model") ?? undefined,
      defect: sp.get("defect") ?? undefined,
    }),
  );
}
```

- [ ] **Step 2: model**

`src/app/api/quality/stats/model/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getModelDashboard } from "@/lib/quality/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const model = req.nextUrl.searchParams.get("model");
  if (!model) return NextResponse.json({ error: "model is required" }, { status: 400 });
  return NextResponse.json(getModelDashboard(model));
}
```

- [ ] **Step 3: global**

`src/app/api/quality/stats/global/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getGlobalDashboard } from "@/lib/quality/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getGlobalDashboard());
}
```

- [ ] **Step 4: 빌드 확인 + 커밋**

Run: `pnpm build`
Expected: 성공

```bash
git add src/app/api/quality/stats
git commit -m "feat(quality): 통계 API 3종(원인 랭킹/모델/전사)"
```

---

## Task 15: 시드 스크립트 (기존 엑셀 import)

**Files:**
- Create: `scripts/seed-quality.mjs`

- [ ] **Step 1: 스크립트 작성**

```js
// 사용법: node scripts/seed-quality.mjs <엑셀파일경로>
// 예:    node scripts/seed-quality.mjs ~/Downloads/부적합관리대장.xlsx
import path from "node:path";
import fs from "node:fs";
import url from "node:url";

const arg = process.argv[2];
if (!arg) { console.error("엑셀 파일 경로를 인자로 주세요."); process.exit(1); }

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
process.env.QUALITY_DB_PATH = process.env.QUALITY_DB_PATH || path.join(__dirname, "..", "data", "quality.db");

// .ts를 직접 import하기 위해 tsx 또는 ts-node가 필요하나, 여기서는 require-style 우회 대신
// 빌드된 JS가 없으므로 핵심 로직을 인라인으로 호출한다. (가장 단순한 방법: tsx 사용)
// pnpm dlx tsx scripts/seed-quality.mjs <path> 로 실행하거나,
// 아래처럼 동적으로 모듈을 로드하기 위해 tsx 런타임이 필요.

const { parseExcel } = await import("../src/lib/quality/excel.ts");
const { upsertExcelRows } = await import("../src/lib/quality/repository.ts");

const buf = fs.readFileSync(path.resolve(arg));
const { rows, errors } = parseExcel(buf);
const { inserted, updated } = rows.length ? upsertExcelRows(rows) : { inserted: 0, updated: 0 };
console.log(`완료: 신규 ${inserted}건 / 갱신 ${updated}건 / 에러 ${errors.length}건`);
if (errors.length) console.log(errors.slice(0, 20));
```

- [ ] **Step 2: package.json scripts 변경**

`seed:quality`를 `tsx`로 실행되도록 변경:

```json
"seed:quality": "tsx scripts/seed-quality.mjs"
```

- [ ] **Step 3: tsx 설치**

```bash
pnpm add -D tsx
```

- [ ] **Step 4: 시드 실행**

Run: `pnpm seed:quality "/Users/user/Downloads/부적합관리대장.xlsx"`
Expected: `완료: 신규 1392건 / 갱신 0건 / 에러 N건` 형태의 출력. (에러 행은 사용자에게 보여만 줌)

- [ ] **Step 5: 커밋**

```bash
git add scripts/seed-quality.mjs package.json pnpm-lock.yaml
git commit -m "chore(quality): 기존 엑셀 시드 스크립트"
```

---

## Task 16: UI 공통 컴포넌트

**Files:**
- Create: `src/components/quality/SourceBadge.tsx`
- Create: `src/components/quality/PasswordModal.tsx`
- Create: `src/components/quality/Combobox.tsx`

- [ ] **Step 1: SourceBadge**

```tsx
import type { Source } from "@/lib/quality/types";

const STYLES: Record<Source, string> = {
  excel: "bg-emerald-100 text-emerald-700",
  web: "bg-sky-100 text-sky-700",
};
const LABELS: Record<Source, string> = { excel: "엑셀", web: "수기" };

export default function SourceBadge({ source }: { source: Source }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STYLES[source]}`}>
      {LABELS[source]}
    </span>
  );
}
```

- [ ] **Step 2: PasswordModal**

```tsx
"use client";
import { useState } from "react";

interface Props {
  open: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void> | void;
}

export default function PasswordModal({ open, title = "비밀번호 확인", onClose, onConfirm }: Props) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await onConfirm(pw);
      setPw("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "비밀번호 확인 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <input
          autoFocus type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          placeholder="비밀번호" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300">취소</button>
          <button type="submit" disabled={busy || !pw} className="px-4 py-2 text-sm rounded-lg bg-navy text-white disabled:opacity-50">
            {busy ? "확인 중…" : "확인"}
          </button>
        </div>
      </form>
    </div>
  );
}

const KEY = "quality-password";
export function getStoredPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KEY);
}
export function setStoredPassword(pw: string) { sessionStorage.setItem(KEY, pw); }
export function clearStoredPassword() { sessionStorage.removeItem(KEY); }
```

- [ ] **Step 3: Combobox**

```tsx
"use client";
import { useState, useRef, useEffect } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function Combobox({ value, onChange, options, placeholder, className = "", disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = value
    ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))
    : options;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-100"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {filtered.slice(0, 100).map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => { e.preventDefault(); onChange(opt); setOpen(false); }}
              className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer"
            >{opt}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/quality
git commit -m "feat(quality): UI 공용 컴포넌트(SourceBadge/PasswordModal/Combobox)"
```

---

## Task 17: `/quality` 검색·리스트 화면

**Files:**
- Create: `src/components/quality/FilterBar.tsx`
- Create: `src/components/quality/NCTable.tsx`
- Create: `src/app/quality/page.tsx`

- [ ] **Step 1: FilterBar**

```tsx
"use client";
import { useEffect, useState } from "react";
import Combobox from "./Combobox";

export interface FilterState {
  q: string; model: string; defect: string; cause: string; action: string;
  lot: string; from: string; to: string;
}

interface Props {
  initial: FilterState;
  options: { models: string[]; defects: string[]; causes: string[]; actions: string[] };
  onSubmit: (f: FilterState) => void;
}

export default function FilterBar({ initial, options, onSubmit }: Props) {
  const [f, setF] = useState<FilterState>(initial);
  useEffect(() => setF(initial), [initial]);

  function submit(next: Partial<FilterState> = {}) {
    const merged = { ...f, ...next };
    setF(merged);
    onSubmit(merged);
  }
  function reset() {
    const empty: FilterState = { q: "", model: "", defect: "", cause: "", action: "", lot: "", from: "", to: "" };
    setF(empty); onSubmit(empty);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="통합검색 (모델/원인/조치/처리자/번호 등)"
          className="md:col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <input value={f.lot} onChange={(e) => setF({ ...f, lot: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="LOT 번호" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })}
            className="flex-1 border border-slate-300 rounded-lg px-2 py-2 text-sm" />
          <input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })}
            className="flex-1 border border-slate-300 rounded-lg px-2 py-2 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Combobox value={f.model} onChange={(v) => setF({ ...f, model: v })} options={options.models} placeholder="모델명" />
        <Combobox value={f.defect} onChange={(v) => setF({ ...f, defect: v })} options={options.defects} placeholder="부적합 내용" />
        <Combobox value={f.cause} onChange={(v) => setF({ ...f, cause: v })} options={options.causes} placeholder="부적합 원인" />
        <Combobox value={f.action} onChange={(v) => setF({ ...f, action: v })} options={options.actions} placeholder="조치사항" />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={reset} className="px-4 py-2 text-sm rounded-lg border border-slate-300">초기화</button>
        <button onClick={() => submit()} className="px-4 py-2 text-sm rounded-lg bg-navy text-white">검색</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: NCTable**

```tsx
"use client";
import Link from "next/link";
import SourceBadge from "./SourceBadge";
import type { NonConformance } from "@/lib/quality/types";

interface Props {
  rows: NonConformance[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

export default function NCTable({ rows, total, page, pageSize, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">NC번호</th>
              <th className="px-3 py-2 text-left">일자</th>
              <th className="px-3 py-2 text-left">모델명</th>
              <th className="px-3 py-2 text-left">LOT</th>
              <th className="px-3 py-2 text-left">부적합 내용</th>
              <th className="px-3 py-2 text-left">원인</th>
              <th className="px-3 py-2 text-left">조치</th>
              <th className="px-3 py-2 text-left">처리결과</th>
              <th className="px-3 py-2 text-left">처리자</th>
              <th className="px-3 py-2 text-left">소스</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-12 text-center text-slate-500">검색 조건과 일치하는 부적합 이력이 없습니다.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.nc_no} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-mono">
                  <Link className="text-accent-blue hover:underline" href={`/quality/${r.nc_no}`}>{r.nc_no}</Link>
                </td>
                <td className="px-3 py-2">{r.written_date}</td>
                <td className="px-3 py-2">{r.model_name}</td>
                <td className="px-3 py-2">{r.lot_no ?? "-"}</td>
                <td className="px-3 py-2">{r.defect}</td>
                <td className="px-3 py-2">{r.cause ?? "-"}</td>
                <td className="px-3 py-2">{r.action ?? "-"}</td>
                <td className="px-3 py-2">{r.result ?? "-"}</td>
                <td className="px-3 py-2">{r.handler ?? "-"}</td>
                <td className="px-3 py-2"><SourceBadge source={r.source} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
        <span className="text-slate-500">총 {total.toLocaleString()}건</span>
        <div className="flex items-center gap-1">
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
            className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40">이전</button>
          <span className="px-2">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
            className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40">다음</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `/quality/page.tsx`**

```tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import FilterBar, { FilterState } from "@/components/quality/FilterBar";
import NCTable from "@/components/quality/NCTable";
import type { NCListResult } from "@/lib/quality/types";

const EMPTY: FilterState = { q: "", model: "", defect: "", cause: "", action: "", lot: "", from: "", to: "" };

export default function QualityPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => readFilters(sp));
  const [page, setPage] = useState<number>(Number(sp.get("page")) || 1);
  const [data, setData] = useState<NCListResult | null>(null);
  const [options, setOptions] = useState({ models: [] as string[], defects: [] as string[], causes: [] as string[], actions: [] as string[] });

  useEffect(() => { fetch("/api/quality/options").then((r) => r.json()).then(setOptions); }, []);

  const fetchList = useCallback(async (f: FilterState, p: number) => {
    const q = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && q.set(k, v));
    q.set("page", String(p));
    q.set("pageSize", "50");
    const res = await fetch(`/api/quality?${q.toString()}`);
    setData(await res.json());
  }, []);

  useEffect(() => { fetchList(filters, page); }, [fetchList, filters, page]);

  function applyFilters(f: FilterState) {
    setFilters(f); setPage(1);
    const q = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && q.set(k, v));
    router.replace(`/quality${q.toString() ? `?${q}` : ""}`);
  }

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">품질관리</h1>
          <p className="text-sm text-slate-500 mt-1">부적합품 이력 검색 및 관리</p>
        </div>
        <div className="flex gap-2">
          <Link href="/quality/stats" className="px-4 py-2 text-sm rounded-lg border border-slate-300">통계</Link>
          <Link href="/quality/import" className="px-4 py-2 text-sm rounded-lg border border-slate-300">엑셀 업로드</Link>
          <Link href="/quality/new" className="px-4 py-2 text-sm rounded-lg bg-navy text-white">+ 신규 등록</Link>
        </div>
      </div>
      <div className="space-y-4">
        <FilterBar initial={filters} options={options} onSubmit={applyFilters} />
        {data && (
          <NCTable rows={data.rows} total={data.total} page={data.page} pageSize={data.pageSize} onPageChange={setPage} />
        )}
      </div>
    </Container>
  );
}

function readFilters(sp: URLSearchParams): FilterState {
  return {
    q: sp.get("q") ?? "",
    model: sp.get("model") ?? "",
    defect: sp.get("defect") ?? "",
    cause: sp.get("cause") ?? "",
    action: sp.get("action") ?? "",
    lot: sp.get("lot") ?? "",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
  };
}
```

- [ ] **Step 4: 빌드 + 수동 확인**

Run: `pnpm build`
Expected: 성공

(개발 시) Run: `pnpm dev` 후 `http://localhost:3000/quality` 확인. 1300건 리스트가 페이지네이션과 함께 나오는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/components/quality/FilterBar.tsx src/components/quality/NCTable.tsx src/app/quality/page.tsx
git commit -m "feat(quality): /quality 검색·리스트 화면"
```

---

## Task 18: `/quality/new` 신규 등록

**Files:**
- Create: `src/components/quality/NCForm.tsx`
- Create: `src/app/quality/new/page.tsx`

- [ ] **Step 1: NCForm (등록/수정 공용)**

```tsx
"use client";
import { useEffect, useState } from "react";
import Combobox from "./Combobox";
import type { NonConformance } from "@/lib/quality/types";

interface Props {
  initial?: Partial<NonConformance>;
  submitLabel: string;
  onSubmit: (input: NCFormValue) => Promise<void> | void;
}

export interface NCFormValue {
  written_date: string; model_name: string; lot_no: string;
  defect: string; cause: string; action: string; result: string; handler: string;
}

export default function NCForm({ initial, submitLabel, onSubmit }: Props) {
  const [v, setV] = useState<NCFormValue>({
    written_date: initial?.written_date ?? new Date().toISOString().slice(0, 10),
    model_name: initial?.model_name ?? "",
    lot_no: initial?.lot_no ?? "",
    defect: initial?.defect ?? "",
    cause: initial?.cause ?? "",
    action: initial?.action ?? "",
    result: initial?.result ?? "",
    handler: initial?.handler ?? "",
  });
  const [opts, setOpts] = useState({ models: [] as string[], defects: [] as string[], causes: [] as string[], actions: [] as string[], handlers: [] as string[] });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/quality/options${v.model_name ? `?model=${encodeURIComponent(v.model_name)}` : ""}`)
      .then((r) => r.json())
      .then(setOpts);
  }, [v.model_name]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.model_name.trim()) return alert("모델명은 필수입니다.");
    if (!v.defect.trim()) return alert("부적합 내용은 필수입니다.");
    setBusy(true);
    try { await onSubmit(v); } finally { setBusy(false); }
  }

  const field = "border border-slate-300 rounded-lg px-3 py-2 text-sm";
  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1"><span className="text-sm font-medium">작성일자 *</span>
          <input type="date" required value={v.written_date} onChange={(e) => setV({ ...v, written_date: e.target.value })} className={`w-full ${field}`} />
        </label>
        <label className="space-y-1"><span className="text-sm font-medium">모델명 *</span>
          <Combobox value={v.model_name} onChange={(x) => setV({ ...v, model_name: x })} options={opts.models} placeholder="예: SDS6-24-12" />
        </label>
        <label className="space-y-1"><span className="text-sm font-medium">LOT 번호</span>
          <input value={v.lot_no} onChange={(e) => setV({ ...v, lot_no: e.target.value })} className={`w-full ${field}`} />
        </label>
        <label className="space-y-1"><span className="text-sm font-medium">처리자</span>
          <Combobox value={v.handler} onChange={(x) => setV({ ...v, handler: x })} options={opts.handlers} />
        </label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-medium">부적합 내용 *</span>
          <Combobox value={v.defect} onChange={(x) => setV({ ...v, defect: x })} options={opts.defects} placeholder="예: 출력없음" />
        </label>
        <label className="space-y-1"><span className="text-sm font-medium">부적합 원인</span>
          <Combobox value={v.cause} onChange={(x) => setV({ ...v, cause: x })} options={opts.causes} />
        </label>
        <label className="space-y-1"><span className="text-sm font-medium">조치사항</span>
          <Combobox value={v.action} onChange={(x) => setV({ ...v, action: x })} options={opts.actions} />
        </label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-medium">처리결과</span>
          <input value={v.result} onChange={(e) => setV({ ...v, result: e.target.value })} className={`w-full ${field}`} />
        </label>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm rounded-lg bg-navy text-white disabled:opacity-50">
          {busy ? "처리 중…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: `/quality/new/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import NCForm, { NCFormValue } from "@/components/quality/NCForm";
import PasswordModal, { getStoredPassword, setStoredPassword, clearStoredPassword } from "@/components/quality/PasswordModal";

export default function NewQualityPage() {
  const router = useRouter();
  const [pendingValue, setPendingValue] = useState<NCFormValue | null>(null);
  const [pwOpen, setPwOpen] = useState(false);

  async function trySubmit(v: NCFormValue, password: string) {
    const res = await fetch("/api/quality", {
      method: "POST",
      headers: { "content-type": "application/json", "x-quality-password": password },
      body: JSON.stringify(v),
    });
    if (res.status === 401) { clearStoredPassword(); throw new Error("비밀번호가 올바르지 않습니다."); }
    if (!res.ok) { throw new Error((await res.json()).error || "등록 실패"); }
    const created = await res.json();
    router.push(`/quality/${created.nc_no}`);
  }

  async function onSubmit(v: NCFormValue) {
    const stored = getStoredPassword();
    if (stored) {
      try { await trySubmit(v, stored); return; }
      catch (e) { if (!(e instanceof Error && e.message.includes("비밀번호"))) { alert((e as Error).message); return; } }
    }
    setPendingValue(v);
    setPwOpen(true);
  }

  return (
    <Container className="py-8">
      <h1 className="text-2xl font-bold mb-6">신규 부적합품 등록</h1>
      <NCForm submitLabel="등록" onSubmit={onSubmit} />
      <PasswordModal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        onConfirm={async (pw) => {
          if (!pendingValue) return;
          await trySubmit(pendingValue, pw);
          setStoredPassword(pw);
          setPwOpen(false);
        }}
      />
    </Container>
  );
}
```

- [ ] **Step 3: 빌드 확인 + 커밋**

```bash
pnpm build
git add src/components/quality/NCForm.tsx src/app/quality/new/page.tsx
git commit -m "feat(quality): /quality/new 신규 등록 화면"
```

---

## Task 19: `/quality/[nc_no]` 상세/수정/삭제

**Files:**
- Create: `src/app/quality/[nc_no]/page.tsx`

- [ ] **Step 1: 페이지 작성**

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Container from "@/components/ui/Container";
import NCForm, { NCFormValue } from "@/components/quality/NCForm";
import SourceBadge from "@/components/quality/SourceBadge";
import PasswordModal, { getStoredPassword, setStoredPassword, clearStoredPassword } from "@/components/quality/PasswordModal";
import type { NonConformance } from "@/lib/quality/types";

type Pending = { kind: "patch"; value: NCFormValue } | { kind: "delete" };

export default function QualityDetailPage() {
  const params = useParams<{ nc_no: string }>();
  const router = useRouter();
  const [data, setData] = useState<NonConformance | null>(null);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/quality/${params.nc_no}`).then((r) => r.json()).then((d) => {
      if (d?.error) router.replace("/quality");
      else setData(d);
    });
  }, [params.nc_no, router]);

  async function callPatch(v: NCFormValue, pw: string) {
    const res = await fetch(`/api/quality/${params.nc_no}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-quality-password": pw },
      body: JSON.stringify(v),
    });
    if (res.status === 401) { clearStoredPassword(); throw new Error("비밀번호가 올바르지 않습니다."); }
    if (!res.ok) throw new Error((await res.json()).error || "수정 실패");
    setData(await res.json());
    setEditing(false);
  }

  async function callDelete(pw: string) {
    const res = await fetch(`/api/quality/${params.nc_no}`, {
      method: "DELETE",
      headers: { "x-quality-password": pw },
    });
    if (res.status === 401) { clearStoredPassword(); throw new Error("비밀번호가 올바르지 않습니다."); }
    if (!res.ok) throw new Error((await res.json()).error || "삭제 실패");
    router.replace("/quality");
  }

  async function tryWithStored(action: () => Promise<Pending>): Promise<void> {
    const p = await action();
    const stored = getStoredPassword();
    if (stored) {
      try {
        if (p.kind === "patch") await callPatch(p.value, stored);
        else await callDelete(stored);
        return;
      } catch (e) {
        if (!(e instanceof Error && e.message.includes("비밀번호"))) { alert((e as Error).message); return; }
      }
    }
    setPending(p); setPwOpen(true);
  }

  function onSubmit(v: NCFormValue) {
    return tryWithStored(async () => ({ kind: "patch", value: v }));
  }
  function onDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    void tryWithStored(async () => ({ kind: "delete" }));
  }

  if (!data) return <Container className="py-8">로딩 중…</Container>;

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-mono">{data.nc_no}</h1>
          <SourceBadge source={data.source} />
        </div>
        <div className="flex gap-2">
          {!editing && <button onClick={() => setEditing(true)} className="px-4 py-2 text-sm rounded-lg border border-slate-300">수정</button>}
          {!editing && <button onClick={onDelete} className="px-4 py-2 text-sm rounded-lg border border-red-300 text-red-600">삭제</button>}
          {editing && <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-300">취소</button>}
        </div>
      </div>

      {editing ? (
        <NCForm initial={data} submitLabel="저장" onSubmit={onSubmit} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm max-w-3xl">
          <Field k="작성일자" v={data.written_date} />
          <Field k="모델명" v={data.model_name} />
          <Field k="LOT 번호" v={data.lot_no} />
          <Field k="처리자" v={data.handler} />
          <Field k="부적합 내용" v={data.defect} />
          <Field k="부적합 원인" v={data.cause} />
          <Field k="조치사항" v={data.action} />
          <Field k="처리결과" v={data.result} />
          <Field k="등록일" v={data.created_at} />
          <Field k="수정일" v={data.updated_at} />
        </div>
      )}

      <PasswordModal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        onConfirm={async (pw) => {
          if (!pending) return;
          if (pending.kind === "patch") await callPatch(pending.value, pw);
          else await callDelete(pw);
          setStoredPassword(pw);
          setPwOpen(false);
        }}
      />
    </Container>
  );
}

function Field({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex">
      <span className="w-24 text-slate-500">{k}</span>
      <span className="flex-1 text-slate-900">{v || "-"}</span>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 + 커밋**

```bash
pnpm build
git add src/app/quality/[nc_no]/page.tsx
git commit -m "feat(quality): /quality/[nc_no] 상세/수정/삭제 화면"
```

---

## Task 20: `/quality/import` 엑셀 업로드 화면

**Files:**
- Create: `src/app/quality/import/page.tsx`

- [ ] **Step 1: 페이지 작성**

```tsx
"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import PasswordModal, { getStoredPassword, setStoredPassword, clearStoredPassword } from "@/components/quality/PasswordModal";

interface ImportResp { inserted: number; updated: number; skipped: number; errors: { row: number; reason: string }[]; total: number }

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function call(pw: string) {
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/quality/import", { method: "POST", headers: { "x-quality-password": pw }, body: fd });
      if (res.status === 401) { clearStoredPassword(); throw new Error("비밀번호가 올바르지 않습니다."); }
      if (!res.ok) throw new Error((await res.json()).error || "업로드 실패");
      setResult(await res.json());
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  }

  async function onUpload() {
    if (!file) return;
    const stored = getStoredPassword();
    if (stored) { await call(stored); if (err) setPwOpen(true); return; }
    setPwOpen(true);
  }

  function downloadErrors() {
    if (!result) return;
    const csv = ["row,reason", ...result.errors.map((e) => `${e.row},"${e.reason.replace(/"/g, '""')}"`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "import-errors.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Container className="py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">엑셀 업로드</h1>
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <p className="text-sm text-slate-600">
          업로드 시 <b>부적합품 번호</b> 기준으로 upsert(있으면 갱신, 없으면 신규)됩니다.
          시트명이 <code>부적합품 관리 대장</code>이면 자동 인식하며, 없으면 첫 시트를 사용합니다.
        </p>
        <input type="file" accept=".xlsx,.xls" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setErr(null); }}
          className="block text-sm" />
        <div className="flex justify-end gap-2">
          <button disabled={!file || busy} onClick={onUpload} className="px-5 py-2 text-sm rounded-lg bg-navy text-white disabled:opacity-50">
            {busy ? "업로드 중…" : "업로드 실행"}
          </button>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        {result && (
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label="신규" value={result.inserted} tone="emerald" />
              <Stat label="갱신" value={result.updated} tone="sky" />
              <Stat label="스킵(에러)" value={result.skipped} tone="amber" />
            </div>
            {result.errors.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold">에러 행 ({result.errors.length})</h3>
                  <button onClick={downloadErrors} className="text-xs text-accent-blue">CSV 다운로드</button>
                </div>
                <div className="max-h-60 overflow-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left">행</th><th className="px-3 py-2 text-left">사유</th></tr></thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i} className="border-t border-slate-100"><td className="px-3 py-1.5">{e.row}</td><td className="px-3 py-1.5">{e.reason}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PasswordModal open={pwOpen} onClose={() => setPwOpen(false)} onConfirm={async (pw) => {
        await call(pw); setStoredPassword(pw); setPwOpen(false);
      }} />
    </Container>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "emerald" | "sky" | "amber" }) {
  const cls = { emerald: "bg-emerald-50 text-emerald-700", sky: "bg-sky-50 text-sky-700", amber: "bg-amber-50 text-amber-700" }[tone];
  return (
    <div className={`rounded-lg p-4 ${cls}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 + 커밋**

```bash
pnpm build
git add src/app/quality/import/page.tsx
git commit -m "feat(quality): /quality/import 엑셀 업로드 화면"
```

---

## Task 21: `/quality/stats` — 탭 1 (원인 랭킹, 메인)

**Files:**
- Create: `src/components/quality/CauseRanking.tsx`
- Create: `src/app/quality/stats/page.tsx` (3개 탭 셸 포함)

- [ ] **Step 1: CauseRanking 컴포넌트**

```tsx
import Link from "next/link";

export interface RankRow { key: string; count: number; percent: number }

interface Props {
  title: string;
  rows: RankRow[];
  hrefBuilder?: (key: string) => string;
}

export default function CauseRanking({ title, rows, hrefBuilder }: Props) {
  const max = rows[0]?.percent ?? 0;
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 font-semibold">{title}</div>
      {rows.length === 0 ? (
        <div className="px-4 py-12 text-center text-slate-500 text-sm">데이터 없음</div>
      ) : (
        <ol className="divide-y divide-slate-100">
          {rows.map((r, i) => {
            const w = max > 0 ? Math.round((r.percent / max) * 100) : 0;
            const content = (
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 text-right text-slate-400 text-sm">{i + 1}</span>
                <span className="flex-1 font-medium">{r.key}</span>
                <span className="w-16 text-right text-sm tabular-nums">{r.count}건</span>
                <span className="w-16 text-right text-sm tabular-nums text-slate-500">{r.percent}%</span>
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-blue" style={{ width: `${w}%` }} />
                </div>
              </div>
            );
            return (
              <li key={r.key} className="hover:bg-slate-50">
                {hrefBuilder ? <Link href={hrefBuilder(r.key)}>{content}</Link> : content}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `/quality/stats/page.tsx` (탭 셸 + 탭1 본문)**

```tsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import Combobox from "@/components/quality/Combobox";
import CauseRanking from "@/components/quality/CauseRanking";

type Tab = "causes" | "model" | "global";

export default function StatsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) || "causes");

  function setTabAndPush(t: Tab) {
    setTab(t);
    const q = new URLSearchParams(sp.toString()); q.set("tab", t);
    router.replace(`/quality/stats?${q.toString()}`);
  }

  return (
    <Container className="py-8">
      <h1 className="text-2xl font-bold mb-6">통계</h1>
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        <TabBtn active={tab === "causes"} onClick={() => setTabAndPush("causes")} highlight>원인 랭킹</TabBtn>
        <TabBtn active={tab === "model"} onClick={() => setTabAndPush("model")}>모델 대시보드</TabBtn>
        <TabBtn active={tab === "global"} onClick={() => setTabAndPush("global")}>전사 대시보드</TabBtn>
      </div>
      {tab === "causes" && <CausesTab />}
      {tab === "model" && <ModelTab />}
      {tab === "global" && <GlobalTab />}
    </Container>
  );
}

function TabBtn({ active, highlight, children, onClick }: { active: boolean; highlight?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`relative px-4 py-2 text-sm font-medium ${active ? "text-navy" : "text-slate-500"}`}>
      {children}
      {highlight && !active && <span className="absolute -top-1 -right-1 text-[10px] bg-accent-blue text-white rounded px-1">MAIN</span>}
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy" />}
    </button>
  );
}

function CausesTab() {
  const sp = useSearchParams();
  const router = useRouter();
  const [model, setModel] = useState(sp.get("model") ?? "");
  const [defect, setDefect] = useState(sp.get("defect") ?? "");
  const [opts, setOpts] = useState({ models: [] as string[], defects: [] as string[] });
  const [data, setData] = useState<{ total: number; range: { from: string | null; to: string | null }; causes: { key: string; count: number; percent: number }[]; actions: { key: string; count: number; percent: number }[] } | null>(null);

  useEffect(() => {
    const url = `/api/quality/options${model ? `?model=${encodeURIComponent(model)}` : ""}`;
    fetch(url).then((r) => r.json()).then((o) => setOpts({ models: o.models, defects: o.defects }));
  }, [model]);

  function search() {
    const q = new URLSearchParams({ tab: "causes" });
    if (model) q.set("model", model);
    if (defect) q.set("defect", defect);
    router.replace(`/quality/stats?${q.toString()}`);
    fetch(`/api/quality/stats/causes?${q.toString().replace("tab=causes&","").replace("tab=causes","")}`).then((r) => r.json()).then(setData);
  }

  useEffect(() => { if (model || defect) search(); /* initial */ }, []); // eslint-disable-line

  const hrefBuilder = (cause: string) => {
    const q = new URLSearchParams();
    if (model) q.set("model", model);
    if (defect) q.set("defect", defect);
    q.set("cause", cause);
    return `/quality?${q.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="space-y-1"><span className="text-sm font-medium">모델명</span>
          <Combobox value={model} onChange={setModel} options={opts.models} placeholder="예: SDS6-24-12" />
        </div>
        <div className="space-y-1"><span className="text-sm font-medium">부적합 내용</span>
          <Combobox value={defect} onChange={setDefect} options={opts.defects} placeholder="예: 입력쇼트" disabled={!model && opts.defects.length === 0} />
        </div>
        <button onClick={search} className="px-5 py-2 text-sm rounded-lg bg-navy text-white">조회</button>
      </div>
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div><div className="text-xs text-slate-500">총 건수</div><div className="text-3xl font-bold">{data.total.toLocaleString()}</div></div>
            <div><div className="text-xs text-slate-500">기간</div><div className="text-sm">{data.range.from ?? "-"} ~ {data.range.to ?? "-"}</div></div>
            <div><div className="text-xs text-slate-500">고유 원인 수</div><div className="text-2xl font-semibold">{data.causes.length}</div></div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <CauseRanking title="부적합 원인 랭킹" rows={data.causes} hrefBuilder={hrefBuilder} />
            <CauseRanking title="조치사항 랭킹" rows={data.actions} />
          </div>
        </div>
      )}
    </div>
  );
}

// 다음 두 함수는 Task 22에서 채운다. 지금은 placeholder.
function ModelTab()  { return <div className="text-slate-500 text-sm">모델 대시보드 (다음 단계에서 구현)</div>; }
function GlobalTab() { return <div className="text-slate-500 text-sm">전사 대시보드 (다음 단계에서 구현)</div>; }
```

- [ ] **Step 3: 빌드 + 커밋**

```bash
pnpm build
git add src/components/quality/CauseRanking.tsx src/app/quality/stats/page.tsx
git commit -m "feat(quality): /quality/stats 원인 랭킹 탭(메인)"
```

---

## Task 22: 통계 탭 2 (모델 대시보드) + 탭 3 (전사 대시보드)

**Files:**
- Modify: `src/app/quality/stats/page.tsx` (`ModelTab`, `GlobalTab` 채우기)

- [ ] **Step 1: ModelTab 구현**

`src/app/quality/stats/page.tsx` 하단의 `ModelTab` 함수를 다음으로 교체:

```tsx
function ModelTab() {
  const sp = useSearchParams();
  const router = useRouter();
  const [model, setModel] = useState(sp.get("model") ?? "");
  const [opts, setOpts] = useState<string[]>([]);
  const [d, setD] = useState<null | {
    total: number; recent30: number; uniqueLots: number; topDefect: string | null;
    monthly: { month: string; count: number }[];
    topDefects: { key: string; count: number; percent: number }[];
    topCauses: { key: string; count: number; percent: number }[];
    recentRows: { nc_no: string; written_date: string; defect: string; cause: string | null }[];
  }>(null);

  useEffect(() => { fetch("/api/quality/options").then((r) => r.json()).then((o) => setOpts(o.models)); }, []);
  useEffect(() => {
    if (!model) { setD(null); return; }
    fetch(`/api/quality/stats/model?model=${encodeURIComponent(model)}`).then((r) => r.json()).then(setD);
    const q = new URLSearchParams(sp.toString()); q.set("tab", "model"); q.set("model", model);
    router.replace(`/quality/stats?${q.toString()}`);
  }, [model]); // eslint-disable-line

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 max-w-md">
        <Combobox value={model} onChange={setModel} options={opts} placeholder="모델명 선택" />
      </div>
      {d && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card label="총 부적합" value={d.total.toLocaleString()} />
            <Card label="최근 30일" value={d.recent30.toLocaleString()} />
            <Card label="고유 LOT" value={d.uniqueLots.toLocaleString()} />
            <Card label="최다 부적합" value={d.topDefect ?? "-"} />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="font-semibold mb-2">월별 추이 (최근 12개월)</div>
            <MonthlyChart data={d.monthly} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CauseRanking title="부적합 내용 TOP 5" rows={d.topDefects} />
            <CauseRanking title="부적합 원인 TOP 5" rows={d.topCauses} />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="px-4 py-3 border-b border-slate-100 font-semibold">최근 이력 10건</div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr>
                <th className="px-3 py-2 text-left">NC</th><th className="px-3 py-2 text-left">일자</th>
                <th className="px-3 py-2 text-left">부적합 내용</th><th className="px-3 py-2 text-left">원인</th>
              </tr></thead>
              <tbody>{d.recentRows.map((r) => (
                <tr key={r.nc_no} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono"><Link className="text-accent-blue hover:underline" href={`/quality/${r.nc_no}`}>{r.nc_no}</Link></td>
                  <td className="px-3 py-2">{r.written_date}</td>
                  <td className="px-3 py-2">{r.defect}</td>
                  <td className="px-3 py-2">{r.cause ?? "-"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1 truncate">{value}</div>
    </div>
  );
}
```

- [ ] **Step 2: 추가 import**

`src/app/quality/stats/page.tsx` 상단에 `Link`와 `recharts` 컴포넌트, `MonthlyChart` 정의 추가:

```tsx
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

function MonthlyChart({ data }: { data: { month: string; count: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 3: GlobalTab 구현**

기존 `GlobalTab`을 다음으로 교체:

```tsx
function GlobalTab() {
  const [d, setD] = useState<null | {
    total: number; recent30: number; modelCount: number; handlerCount: number;
    topModels: { key: string; count: number; percent: number }[];
    topCauses: { key: string; count: number; percent: number }[];
    monthly: { month: string; count: number }[];
    sourceRatio: { source: "excel" | "web"; count: number }[];
  }>(null);

  useEffect(() => { fetch("/api/quality/stats/global").then((r) => r.json()).then(setD); }, []);
  if (!d) return <div className="text-slate-500 text-sm">로딩 중…</div>;

  const PIE_COLORS = ["#10b981", "#0ea5e9"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card label="전체 건수" value={d.total.toLocaleString()} />
        <Card label="최근 30일" value={d.recent30.toLocaleString()} />
        <Card label="모델 수" value={d.modelCount.toLocaleString()} />
        <Card label="처리자 수" value={d.handlerCount.toLocaleString()} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CauseRanking title="부적합 많은 모델 TOP 10" rows={d.topModels} />
        <CauseRanking title="부적합 원인 TOP 10 (전사)" rows={d.topCauses} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 lg:col-span-2">
          <div className="font-semibold mb-2">월별 추이 (최근 12개월)</div>
          <MonthlyChart data={d.monthly} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="font-semibold mb-2">소스 비율</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.sourceRatio.map((r) => ({ name: r.source === "excel" ? "엑셀" : "수기", value: r.count }))}
                     dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {d.sourceRatio.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 빌드 + 커밋**

Run: `pnpm build`
Expected: 성공

```bash
git add src/app/quality/stats/page.tsx
git commit -m "feat(quality): 통계 탭 2(모델 대시보드) + 탭 3(전사 대시보드)"
```

---

## Task 23: Header 메뉴에 `품질관리` 추가

**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: NAV_ITEMS 수정**

`src/components/layout/Header.tsx`의 `NAV_ITEMS` 배열을 다음으로 교체:

```tsx
const NAV_ITEMS = [
  { label: "홈", href: "/" },
  { label: "제품", href: "/products" },
  { label: "품질관리", href: "/quality" },
  { label: "회사소개", href: "/about" },
];
```

- [ ] **Step 2: 빌드 + 수동 확인**

Run: `pnpm build`
Expected: 성공.

(개발 시) `pnpm dev` → 모든 페이지 헤더에 `품질관리` 메뉴 보임.

- [ ] **Step 3: 커밋**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat(quality): 헤더에 품질관리 메뉴 추가"
```

---

## Task 24: 최종 확인 (수동 E2E + 시드 데이터)

이 태스크는 코드 변경 없음, 수동 검증 + 환경 설정만.

- [ ] **Step 1: `.env.local` 생성**

`.env.local` 파일을 만들고 비밀번호 설정 (예시 — 실제 값은 사용자가 정함):

```
QUALITY_ADMIN_PASSWORD=odp1234
```

- [ ] **Step 2: 시드 실행 (이미 했으면 스킵)**

```bash
pnpm seed:quality "/Users/user/Downloads/부적합관리대장.xlsx"
```

- [ ] **Step 3: dev 서버 기동**

```bash
pnpm dev
```

- [ ] **Step 4: 수동 시나리오 확인**

브라우저에서 다음을 차례로 확인:

1. `/quality` — 1300+ 건 리스트 + 필터 동작 (모델명/부적합내용 콤보 자동완성, 일자 범위, LOT)
2. `/quality/stats?tab=causes` — 모델 = `SDS6-24-12`, 부적합 내용 = (그 모델에서 실제로 나온 항목 중 하나) 선택 → 원인 랭킹 표시 + 행 클릭 시 `/quality?...&cause=...` 이동
3. `/quality/stats?tab=model` — 모델 선택 → 카드 4종 + 월별 라인차트 + TOP 5
4. `/quality/stats?tab=global` — 전사 카드 + TOP 10 + 소스 비율 도넛
5. `/quality/new` → 신규 등록 → 비밀번호 입력 → `WNC` prefix nc_no 부여 확인
6. `/quality/[방금 등록한 WNC]` → 수정/삭제 동작 + 비밀번호 검증
7. `/quality/import` → 같은 엑셀 다시 업로드 → `갱신 N건` 결과 (upsert 동작)
8. 헤더 `품질관리` 메뉴 클릭으로 `/quality` 진입

- [ ] **Step 5: 마무리 커밋 (없을 수도 있음)**

추가 변경이 없으면 이 태스크는 commit 없이 종료. 사용자가 envvar/시드 결과를 본 뒤 사용 시작.

---

## Self-Review Notes

- 모든 spec 요구사항(데이터 모델, API, UI 5개 페이지, 통계 3탭, 비밀번호 보호, 엑셀 upsert, WNC 채번)에 대응 태스크 존재
- 코드 블록은 모두 실제 사용 가능한 형태 (placeholder 없음)
- 메서드 시그니처 일관: `listNC`, `createWebNC`, `updateNC`, `deleteNC`, `upsertExcelRows`, `getOptions`, `parseExcel`, `verifyPassword`, `generateWebNcNo`, `normalizeDate` — 사용처와 정의처 모두 일치
- 테스트는 가장 위험한 순수 로직(date, nc-no, excel parse, repository)에 집중. UI/통계는 수동 E2E로 검증
