import { NextResponse } from "next/server";
import { listOddsForKeys, pickBestH2H } from "../../../lib/providers/theodds";
import { impliedNoVig, predictHome, edge } from "../../../lib/predictor";
import { getMetrics } from "../../../lib/player_metrics";
import { scoreValueBet } from "../../../lib/valuebet_ai";

export const dynamic = "force-dynamic";

export async function GET(req: Request){
  const url = new URL(req.url);
  const minOdds = Number(url.searchParams.get("minOdds") || "1.0");
  const minEdge = Number(url.searchParams.get("minEdge") || "0.00");
  const aiOnly = url.searchParams.get("aiOnly") === "1";

  const keys = ["tennis_atp", "tennis_wta", "tennis_atp_challenger", "tennis_itf_men", "tennis_itf_women"];
  const events = await listOddsForKeys(keys);
  const items:any[] = [];

  for(const e of events){
    const best = pickBestH2H(e);
    const o1 = best.home, o2 = best.away;
    if(!o1 || !o2) continue;
    if (o1 < minOdds && o2 < minOdds) continue;

    const nv = impliedNoVig(o1, o2);
    const pHomeModel = predictHome(nv.p1);
    const eHome = edge(pHomeModel, nv.p1);

    if (eHome < minEdge) continue;

    const mHome = getMetrics(e.home_team);
    const mAway = getMetrics(e.away_team);
    const elo_diff = (mHome.elo ?? 0) - (mAway.elo ?? 0);
    const hold_break_home = (mHome.hold_pct ?? 0) + (mHome.break_pct ?? 0);
    const hold_break_away = (mAway.hold_pct ?? 0) + (mAway.break_pct ?? 0);
    const hold_break_diff = hold_break_home - hold_break_away;
    const form30_diff = (mHome.form30 ?? 0) - (mAway.form30 ?? 0);

    const ai = scoreValueBet({
      sport_key: e.sport_key,
      p_market_home: nv.p1,
      p_model_home: pHomeModel,
      elo_diff, hold_break_diff, form30_diff
    });

    if (aiOnly && ai.score < 50) continue;

    items.push({
      id: e.id,
      sport_key: e.sport_key,
      commence_time: e.commence_time,
      home: e.home_team, away: e.away_team,
      best_odds: { home: o1, away: o2 },
      p_market: { home: nv.p1, away: nv.p2 },
      prediction: { p_home: pHomeModel, edge: eHome },
      ai
    });
  }

  items.sort((a,b)=> (b.ai?.score||0) - (a.ai?.score||0));
  return NextResponse.json({ count: items.length, items });
}
