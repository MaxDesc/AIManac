import { NextResponse } from "next/server";
import { listOddsForKeys, pickBestH2H } from "../../../lib/providers/theodds";
import { impliedNoVig, predictHome, edge } from "../../../lib/predictor";

export const dynamic = "force-dynamic";

export async function GET(){
  const keys = ["tennis_atp", "tennis_wta", "tennis_atp_challenger", "tennis_itf_men", "tennis_itf_women"];
  const events = await listOddsForKeys(keys);
  const items:any[] = [];
  for(const e of events){
    const best = pickBestH2H(e);
    if(!best.home || !best.away) continue;
    const nv = impliedNoVig(best.home, best.away);
    const pHome = predictHome(nv.p1);
    items.push({
      id: e.id,
      sport_key: e.sport_key,
      commence_time: e.commence_time,
      home: e.home_team, away: e.away_team,
      best_odds: { home: best.home, away: best.away },
      p_market: { home: nv.p1, away: nv.p2 },
      prediction: { p_home: pHome, edge: edge(pHome, nv.p1) }
    });
  }
  return NextResponse.json({ count: items.length, items });
}
