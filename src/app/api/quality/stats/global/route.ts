import { NextResponse } from "next/server";
import { getGlobalDashboard } from "@/lib/quality/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getGlobalDashboard());
}
