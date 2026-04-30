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
