import { NextRequest, NextResponse } from "next/server";
import { getOptions } from "@/lib/quality/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const model = req.nextUrl.searchParams.get("model") ?? undefined;
  return NextResponse.json(getOptions({ model }));
}
