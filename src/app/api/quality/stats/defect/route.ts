import { NextRequest, NextResponse } from "next/server";
import { getDefectDashboard } from "@/lib/quality/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const defect = sp.get("defect");
  if (!defect) return NextResponse.json({ error: "defect is required" }, { status: 400 });
  const model = sp.get("model") ?? null;
  return NextResponse.json(getDefectDashboard({ defect, model }));
}
