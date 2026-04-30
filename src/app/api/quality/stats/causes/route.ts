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
