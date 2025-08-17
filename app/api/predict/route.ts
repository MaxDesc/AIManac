// app/api/predict/route.ts
import { NextResponse } from "next/server";
import { getPlayerSurfaceStats } from "@/lib/tennisexplorer/player";
import { featuresFromStats, logisticPredict } from "@/lib/ml/featureUtils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/predict?playerA=castagnola&playerB=bilozerstev&surface=hard
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const playerA = (searchParams.get("playerA") || "").trim();
    const playerB = (searchParams.get("playerB") || "").trim();
    const surface = (searchParams.get("surface") || "hard").toLowerCase() as "clay" | "hard" | "indoors" | "grass";

    if (!playerA || !playerB) {
      return NextResponse.json({ error: "playerA and playerB are required" }, { status: 400 });
    }

    const [sa, sb] = await Promise.all([getPlayerSurfaceStats(playerA), getPlayerSurfaceStats(playerB)]);
    const fa = featuresFromStats(sa, surface);
    const fb = featuresFromStats(sb, surface);

    const pA = logisticPredict(fa, fb);
    const pB = 1 - pA;
    const impliedOdds = (p: number) => +(1 / p).toFixed(3);

    const payload = {
      surface,
      players: {
        A: { slug: sa.slug, name: sa.name, rank: sa.rank, features: fa },
        B: { slug: sb.slug, name: sb.name, rank: sb.rank, features: fb }
      },
      probabilities: { A: +pA.toFixed(4), B: +pB.toFixed(4) },
      implied_odds: { A: impliedOdds(pA), B: impliedOdds(pB) }
    };

    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "predict failed" }, { status: 500 });
  }
}
