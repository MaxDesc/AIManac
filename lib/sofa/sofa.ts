// lib/sofa/sofa.ts
type SofaEvent = {
  id: number;
  startTimestamp: number;
  tournament?: { name?: string; category?: { name?: string } };
  tournamentStage?: { name?: string };
  homeTeam?: { name?: string };
  awayTeam?: { name?: string };
  status?: { type?: string };
  customId?: string;
};

const SOFA = process.env.SOFA_URL || "https://api.sofascore.com";

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${SOFA}${path}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sofa http ${res.status}: ${path}`);
  return (await res.json()) as T;
}

export async function getSchedule(dateISO: string) {
  // GET /api/v1/sport/tennis/scheduled-events/{YYYY-MM-DD}
  const data = await fetchJson<{ events: SofaEvent[] }>(
    `/api/v1/sport/tennis/scheduled-events/${dateISO}`
  );
  return data.events || [];
}

export async function getEventWinnerOdds(eventId: number) {
  // GET /api/v1/event/{id}/odds/ — pick 'winner' prematch odds
  const data = await fetchJson<{ markets?: any[] }>(
    `/api/v1/event/${eventId}/odds/`
  );

  const markets = data?.markets || [];
  const m =
    markets.find((x: any) => (x?.name || '').toLowerCase().includes('winner')) ||
    markets.find((x: any) => (x?.marketKey || '').toLowerCase().includes('winner'));
  if (!m?.choices) return { oddsA: null, oddsB: null };

  const home = m.choices.find((c: any) => (c?.name || '').toLowerCase().includes('home'));
  const away = m.choices.find((c: any) => (c?.name || '').toLowerCase().includes('away'));
  const [c0, c1] = home && away ? [home, away] : m.choices.slice(0, 2);

  const oddsA = c0?.price || c0?.decimalValue || null;
  const oddsB = c1?.price || c1?.decimalValue || null;

  return { oddsA: oddsA ? Number(oddsA) : null, oddsB: oddsB ? Number(oddsB) : null };
}
