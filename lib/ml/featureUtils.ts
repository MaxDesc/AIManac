import type { PlayerSurfaceStats } from "@/lib/tennisexplorer/player";

export type Features = {
  winrate_overall: number;   // 0..1
  winrate_surface: number;   // 0..1
  rank_score: number;        // 0..1 (1 meilleur)
};

export function featuresFromStats(
  s: PlayerSurfaceStats,
  surface: "clay" | "hard" | "indoors" | "grass"
) {
  const wrOverall = s.totals.overall.pct ?? 0.5;
  const wrSurface = s.totals[surface].pct ?? wrOverall;
  const r = s.rank ?? 2000;
  const rankScore = 1 - Math.min(1, Math.log10(1 + r) / Math.log10(1 + 2000));
  return { winrate_overall: wrOverall, winrate_surface: wrSurface, rank_score: rankScore };
}

export function logisticPredict(
  fa: ReturnType<typeof featuresFromStats>,
  fb: ReturnType<typeof featuresFromStats>,
  weights = { b0: 0, w_overall: 2.0, w_surface: 3.0, w_rank: 1.2 }
) {
  const d_overall = fa.winrate_overall - fb.winrate_overall;
  const d_surface = fa.winrate_surface - fb.winrate_surface;
  const d_rank = fa.rank_score - fb.rank_score;
  const z = weights.b0 + weights.w_overall * d_overall + weights.w_surface * d_surface + weights.w_rank * d_rank;
  const p = 1 / (1 + Math.exp(-z));
  return Math.min(0.985, Math.max(0.015, p));
}
