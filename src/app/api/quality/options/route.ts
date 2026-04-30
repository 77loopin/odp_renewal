import { NextRequest, NextResponse } from "next/server";
import { getOptions } from "@/lib/quality/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const model = sp.get("model") ?? undefined;
  const modelSort = sp.get("modelSort") === "frequency" ? "frequency" : undefined;
  return NextResponse.json(getOptions({ model, modelSort }));
}
