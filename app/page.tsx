import Link from "next/link";
import { fmtPct, fmtOdd } from "../lib/utils";

async function fetchMatches(){
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/matches`, { cache: "no-store" });
  if(!res.ok) return { items: [] };
  return res.json();
}

export default async function Page(){
  const data = await fetchMatches();
  return (
    <div>
      <h1 style={{fontSize:22, marginBottom:8}}>Matchs à venir (cotes • prédictions)</h1>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:12}}>
        {data.items?.map((it:any)=> (
          <Link key={it.id} href={`/match/${encodeURIComponent(it.id)}`} style={{textDecoration:'none', color:'inherit'}}>
            <div style={{border:'1px solid #1c2230', borderRadius:10, padding:12, background:'#0f1420'}}>
              <div style={{fontWeight:600}}>{it.home} vs {it.away}</div>
              <div style={{fontSize:12, opacity:.7, marginBottom:8}}>{new Date(it.commence_time).toLocaleString()}</div>
              <div style={{display:'flex', gap:12, fontSize:14}}>
                <div style={{flex:1}}><div style={{opacity:.7}}>Cote max</div><div>{fmtOdd(it.best_odds?.home)} / {fmtOdd(it.best_odds?.away)}</div></div>
                <div style={{flex:1}}><div style={{opacity:.7}}>p_market</div><div>{fmtPct(it.p_market?.home)} / {fmtPct(it.p_market?.away)}</div></div>
                <div style={{flex:1}}><div style={{opacity:.7}}>p_model (home)</div><div>{fmtPct(it.prediction?.p_home)}</div></div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {(!data.items || data.items.length===0) && (
        <div style={{marginTop:24, opacity:.8}}>Aucun match disponible depuis l'API (vérifie THE_ODDS_API_KEY).</div>
      )}
    </div>
  );
}
