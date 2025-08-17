// app/api/player/[slug]/surfaces/route.ts
import { NextResponse } from "next/server";
import { getPlayerSurfaceStats } from "@/lib/tennisexplorer/player";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: { slug: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const slug = params.slug?.replace(/\/+$/g, "") || "";
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const stats = await getPlayerSurfaceStats(slug);
    return new NextResponse(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "failed to scrape" }, { status: 500 });
  }
}
