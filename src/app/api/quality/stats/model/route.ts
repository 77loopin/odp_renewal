import { NextRequest, NextResponse } from "next/server";
import { getModelDashboard } from "@/lib/quality/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const model = req.nextUrl.searchParams.get("model");
  if (!model) return NextResponse.json({ error: "model is required" }, { status: 400 });
  return NextResponse.json(getModelDashboard(model));
}
