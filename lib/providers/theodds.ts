const BASE = "https://api.the-odds-api.com/v4";
const KEY = process.env.THE_ODDS_API_KEY;

export type OddsEvent = {
  id: string; sport_key: string; commence_time: string;
  home_team: string; away_team: string;
  bookmakers: { key:string; title:string; last_update:string; markets: { key:string; outcomes: { name:string; price:number }[] }[] }[];
};

export async function listOddsForKeys(keys: string[]): Promise<OddsEvent[]>{
  if(!KEY) return [];
  const out: OddsEvent[] = [];
  for(const k of keys){
    const url = `${BASE}/sports/${k}/odds?markets=h2h&regions=eu&oddsFormat=decimal&dateFormat=iso&apiKey=${KEY}`;
    const res = await fetch(url, { cache: "no-store" });
    if(res.ok){ out.push(...await res.json()); }
  }
  return out;
}

export function pickBestH2H(e: OddsEvent){
  const prices: Record<string,number> = {};
  for(const b of e.bookmakers||[]){
    const m = (b.markets||[]).find(m=>m.key==='h2h'); if(!m) continue;
    for(const o of m.outcomes||[]){
      if(!prices[o.name] || o.price>prices[o.name]) prices[o.name]=o.price;
    }
  }
  const home = prices[e.home_team]; const away = prices[e.away_team];
  return { home, away };
}
