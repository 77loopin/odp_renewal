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
