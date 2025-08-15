import { edge } from "../lib/predictor";

export type Features = {
  sport_key: string;
  p_market_home: number;
  p_model_home: number;
  elo_diff?: number;
  hold_break_diff?: number;
  form30_diff?: number;
};

export function scoreValueBet(f: Features){
  const base = Math.max(0, edge(f.p_model_home, f.p_market_home)); // 0..1
  const basePts = base * 100; // 0..100

  const eloPts  = Math.max(-10, Math.min(10, (f.elo_diff ?? 0) * 0.05));
  const hbPts   = Math.max(-8,  Math.min(8,  (f.hold_break_diff ?? 0) * 0.08));
  const formPts = Math.max(-7,  Math.min(7,  (f.form30_diff ?? 0) * 0.07));

  let conf = 1.0;
  if (f.sport_key.includes("challenger")) conf *= 0.9;
  if (f.sport_key.includes("itf")) conf *= 0.85;

  const raw = (basePts + eloPts + hbPts + formPts) * conf;
  const score = Math.max(0, Math.min(100, raw));

  let badge = "";
  if (score >= 75) badge = "🔥 Forte valeur";
  else if (score >= 55) badge = "👍 Valeur probable";
  else if (score >= 45) badge = "⚠️ Légère valeur";

  return { score, badge };
}
