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
