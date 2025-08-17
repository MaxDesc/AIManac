
// app/api/matches/route.ts
import { NextResponse } from "next/server";
import { getTEMatches } from "@/lib/tennisexplorer/matches";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function dateISO(d: Date) { return d.toISOString().slice(0, 10); }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || dateISO(new Date());
    const matches = await getTEMatches(date);
    return NextResponse.json({ matches }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/matches error:", err?.message || err);
    return NextResponse.json({ matches: [] }, { status: 200 });
  }
}
