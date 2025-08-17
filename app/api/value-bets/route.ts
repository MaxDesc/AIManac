// app/api/value-bets/route.ts
import { NextResponse } from "next/server";
import { getPlayerSurfaceStats } from "@/lib/tennisexplorer/player";
import { featuresFromStats, logisticPredict } from "@/lib/ml/featureUtils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MatchLite = {
  id: string | number;
  tour?: string; round?: string; start?: string;
  playerA?: string; playerB?: string; surface?: string;
  slugA?: string | null; slugB?: string | null;
  oddsA?: number | null; oddsB?: number | null;
};

function csvEscape(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // guillemets doubles doublés
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const base = process.env.SELF_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const res = await fetch(`${base}/api/matches`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ values: [] }, { status: 200 });

    const json = await res.json();
    const matches: MatchLite[] = Array.isArray(json) ? json : json?.matches || [];

    const values: any[] = [];

    for (const m of matches) {
      if (!m.playerA || !m.playerB) continue;
      if (!m.oddsA || !m.oddsB) continue;
      if (!m.slugA || !m.slugB) continue;

      const surface = (m.surface || "hard").toLowerCase() as "hard" | "clay" | "indoors" | "grass";

      const [sa, sb] = await Promise.all([
        getPlayerSurfaceStats(m.slugA),
        getPlayerSurfaceStats(m.slugB)
      ]);

      const fa = featuresFromStats(sa, surface);
      const fb = featuresFromStats(sb, surface);
      const pA = logisticPredict(fa, fb);
      const pB = 1 - pA;

      const impA = 1 / m.oddsA;
      const impB = 1 / m.oddsB;
      const edgeA = pA - impA;
      const edgeB = pB - impB;
      const evA = pA * m.oddsA - 1;
      const evB = pB * m.oddsB - 1;

      if (edgeA > 0) {
        values.push({
          id: m.id,
          match: m,
          side: "A",
          prob: +pA.toFixed(4),
          odds: m.oddsA,
          edge: +edgeA.toFixed(4),
          ev: +evA.toFixed(4),
        });
      }
      if (edgeB > 0) {
        values.push({
          id: m.id,
          match: m,
          side: "B",
          prob: +pB.toFixed(4),
          odds: m.oddsB,
          edge: +edgeB.toFixed(4),
          ev: +evB.toFixed(4),
        });
      }
    }

    values.sort((a, b) => b.ev - a.ev);

    // Export CSV si demandé
    if ((searchParams.get("format") || "").toLowerCase() === "csv") {
      const header = ["id","tour","round","start","player","side","slug","surface","odds","prob","edge","ev"];
      const lines: string[] = [];
      lines.push(header.join(","));
      for (const v of values) {
        const player = v.side === "A" ? v.match.playerA : v.match.playerB;
        const slug   = v.side === "A" ? v.match.slugA   : v.match.slugB;
        const row = [
          csvEscape(v.id),
          csvEscape(v.match.tour || ""),
          csvEscape(v.match.round || ""),
          csvEscape(v.match.start || ""),
          csvEscape(player || ""),
          csvEscape(v.side),
          csvEscape(slug || ""),
          csvEscape(v.match.surface || ""),
          csvEscape(v.odds),
          csvEscape(v.prob),
          csvEscape(v.edge),
          csvEscape(v.ev),
        ];
        lines.push(row.join(","));
      }
      const csv = lines.join("\n");
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=value-bets.csv",
        },
      });
    }

    return NextResponse.json({ values }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "value-bets failed" }, { status: 500 });
  }
}
