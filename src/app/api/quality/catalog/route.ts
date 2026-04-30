import { NextRequest, NextResponse } from "next/server";
import { lookupCatalogMany } from "@/lib/quality/catalog-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/quality/catalog?parts=A,B,C
// → { [part_number]: CatalogProductRow }
export async function GET(req: NextRequest) {
  const partsParam = req.nextUrl.searchParams.get("parts") ?? "";
  const parts = partsParam.split(",").map((s) => s.trim()).filter(Boolean);
  const map = lookupCatalogMany(parts);
  return NextResponse.json(map);
}
