
// app/api/player/[slug]/route.ts
import { NextResponse } from "next/server";
import { getPlayerSurfaceStats } from "@/lib/tennisexplorer/player";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  try {
    const stats = await getPlayerSurfaceStats(params.slug);
    return NextResponse.json(stats, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "fail" }, { status: 500 });
  }
}
