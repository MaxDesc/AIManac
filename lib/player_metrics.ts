export type PlayerMetrics = {
  elo?: number;
  hold_pct?: number;
  break_pct?: number;
  form30?: number;
};

const METRICS: Record<string, PlayerMetrics> = {
  "Novak Djokovic": { elo: 2400, hold_pct: 0.90, break_pct: 0.30, form30: 0.8 },
  "Carlos Alcaraz": { elo: 2350, hold_pct: 0.88, break_pct: 0.28, form30: 0.7 },
  "Iga Swiatek":    { elo: 2300, hold_pct: 0.82, break_pct: 0.44, form30: 0.9 }
};

export function getMetrics(name: string): PlayerMetrics {
  const key = Object.keys(METRICS).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? METRICS[key] : {};
}
