import Link from "next/link";
import { fmtPct, fmtOdd, badgeFromScore } from "../../lib/utils";

async function fetchVB(){
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/value-bets?aiOnly=1`, { cache: "no-store" });
  if(!res.ok) return { items: [] };
  return res.json();
}

export default async function ValueBets(){
  const data = await fetchVB();
  return (
    <div>
      <h1 style={{fontSize:22, marginBottom:8}}>Value Bets (IA)</h1>
      <p style={{opacity:.8, marginBottom:12}}>Basé sur le marché (p_market) + modèle baseline + signaux joueurs (si dispo) + pénalité légère Challenger/ITF.</p>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:12}}>
        {data.items?.map((it:any)=> (
          <Link key={it.id} href={`/match/${encodeURIComponent(it.id)}`} style={{textDecoration:'none', color:'inherit'}}>
            <div style={{border:'1px solid #1c2230', borderRadius:10, padding:12, background:'#0f1420'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div style={{fontWeight:600}}>{it.home} vs {it.away}</div>
                <div style={{fontSize:12, opacity:.9}}>{badgeFromScore(it.ai?.score||0)}</div>
              </div>
              <div style={{fontSize:12, opacity:.7, marginBottom:8}}>{new Date(it.commence_time).toLocaleString()}</div>
              <div style={{display:'flex', gap:12, fontSize:14}}>
                <div style={{flex:1}}><div style={{opacity:.7}}>Cote max</div><div>{fmtOdd(it.best_odds?.home)} / {fmtOdd(it.best_odds?.away)}</div></div>
                <div style={{flex:1}}><div style={{opacity:.7}}>p_market</div><div>{fmtPct(it.p_market?.home)} / {fmtPct(it.p_market?.away)}</div></div>
                <div style={{flex:1}}><div style={{opacity:.7}}>p_model (home)</div><div>{fmtPct(it.prediction?.p_home)}</div></div>
              </div>
              <div style={{marginTop:8, fontSize:12, opacity:.9}}>Score IA: {Math.round(it.ai?.score||0)}</div>
            </div>
          </Link>
        ))}
      </div>
      {(!data.items || data.items.length===0) && (
        <div style={{marginTop:24, opacity:.8}}>Aucune opportunité trouvée (essaie plus tard ou retire le filtre aiOnly).</div>
      )}
    </div>
  );
}
