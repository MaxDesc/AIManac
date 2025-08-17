
// components/MatchModal.tsx
"use client";
import { useEffect, useState } from "react";

type OddsView = { book: string; openA: number|null; openB: number|null; lastA: number|null; lastB: number|null };
function toPct(n: number | null): string { if (!n || n <= 0) return "—"; const p = (100 / n); return `${p.toFixed(1)}%`; }
function delta(a: number | null, b: number | null): string { if (!a || !b) return "—"; const d = ((b - a) / a) * 100; return (d >= 0 ? "+" : "") + d.toFixed(1) + "%"; }


function Sparkline({ points }: { points: number[] }) {
  if (!points || points.length < 2) return null;
  const w = 120, h = 32, pad = 4;
  const min = Math.min(...points), max = Math.max(...points);
  const rng = max - min || 1;
  const x = (i: number) => pad + (i*(w-2*pad))/(points.length-1);
  const y = (v: number) => h - pad - ((v - min) * (h - 2*pad) / rng);
  const path = points.map((v,i) => `${i===0?"M":"L"}${x(i)},${y(v)}`).join(" ");
  return (
    <svg width={w} height={h} aria-label="sparkline">
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

function badgeForTournament(name: string | undefined) {
  const n = (name || "").toLowerCase();
  let label = "Tournoi";
  if (n.includes("wta")) label = "WTA";
  else if (n.includes("atp")) label = "ATP";
  else if (n.includes("challenger")) label = "Challenger";
  else if (n.includes("itf")) label = "ITF";
  return label;
}

export default function MatchModal({ onClose, vb }: { onClose: () => void; vb: any }) {
  const [statsA, setStatsA] = useState<any>(null);
  const [statsB, setStatsB] = useState<any>(null);
  const [odds, setOdds] = useState<OddsView | null>(null);
  const [h2h, setH2H] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [sa, sb] = await Promise.all([
          fetch(`/api/player/${vb.match.slugA}`).then(r => r.json()),
          fetch(`/api/player/${vb.match.slugB}`).then(r => r.json()),
        ]);
        if (!isMounted) return;
        setStatsA(sa); setStatsB(sb);
      } catch {}

      try {
        if (vb.match.matchUrl) {
          const r = await fetch(`/api/match-odds?url=${encodeURIComponent(vb.match.matchUrl)}`).then(r => r.json());
          if (!isMounted) return;
          setOdds(r?.odds || null);
        }
      } catch {}

      try {
        const r = await fetch(`/api/h2h?slugA=${vb.match.slugA}&slugB=${vb.match.slugB}`).then(r => r.json());
        if (!isMounted) return;
        setH2H(r?.h2h || null);
      } catch {}
    }
    load();
    return () => { isMounted = false as any; };
  }, [vb]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-4xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">
              {vb.match.playerA} vs {vb.match.playerB}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
              {vb.match.tour} {vb.match.round ? `· ${vb.match.round}` : ""} {vb.match.start ? `· ${new Date(vb.match.start).toLocaleString()}` : ""}
              <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">{badgeForTournament(vb.match.tour)}</span>
              {vb.match.surface && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">{vb.match.surface}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {vb.match.matchUrl && (
              <a href={vb.match.matchUrl} target="_blank" className="btn">Voir sur TE ↗</a>
            )}
            <button className="btn" onClick={onClose}>Fermer</button>
          </div>
        </div>

        {/* Odds */}
        <div className="mt-4 card">
          <div className="flex items-center justify-between">
            <h4 className="h3">Cotes (TE {odds?.book || "—"})</h4>
            {vb.match.matchUrl && (
              <a href={vb.match.matchUrl} target="_blank" className="text-brand-600 underline">Ouvrir sur TennisExplorer ↗</a>
            )}
          </div>
          {!odds ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Aucune cote historique trouvée sur TE pour ce match.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto text-sm w-full mt-2">
                <thead>
                  <tr className="bg-gray-100 dark:bg-white/10">
                    <th className="px-2 py-1">Joueur</th>
                    <th className="px-2 py-1">Open</th>
                    <th className="px-2 py-1">Dernière</th>
                    <th className="px-2 py-1">Δ Cote</th>
                    <th className="px-2 py-1">Imp. Open</th>
                    <th className="px-2 py-1">Imp. Dernière</th>
                    <th className="px-2 py-1">Δ Imp.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-1">{vb.match.playerA}</td>
                    <td className="px-2 py-1">{odds.openA ?? "—"}</td>
                    <td className="px-2 py-1">{odds.lastA ?? "—"}</td>
                    <td className="px-2 py-1">{delta(odds.openA, odds.lastA)}</td>
                    <td className="px-2 py-1">{toPct(odds.openA)}</td>
                    <td className="px-2 py-1">{toPct(odds.lastA)}</td>
                    <td className="px-2 py-1">
                      {(() => {
                        const a = odds.openA ? 100 / odds.openA : null;
                        const b = odds.lastA ? 100 / odds.lastA : null;
                        return (a !== null && b !== null) ? `${(b - a).toFixed(1)} pts` : "—";
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">{vb.match.playerB}</td>
                    <td className="px-2 py-1">{odds.openB ?? "—"}</td>
                    <td className="px-2 py-1">{odds.lastB ?? "—"}</td>
                    <td className="px-2 py-1">{delta(odds.openB, odds.lastB)}</td>
                    <td className="px-2 py-1">{toPct(odds.openB)}</td>
                    <td className="px-2 py-1">{toPct(odds.lastB)}</td>
                    <td className="px-2 py-1">
                      {(() => {
                        const a = odds.openB ? 100 / odds.openB : null;
                        const b = odds.lastB ? 100 / odds.lastB : null;
                        return (a !== null && b !== null) ? `${(b - a).toFixed(1)} pts` : "—";
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* H2H */}
        <div className="mt-4 card">
          <div className="flex items-center justify-between"><h4 className="h3">Head-to-Head</h4><div className="flex items-center gap-2 text-xs"><a className="btn" href={`/api/h2h?slugA=${vb.match.slugA}&slugB=${vb.match.slugB}&format=json`} target="_blank">Export JSON</a><a className="btn" href={`/api/h2h?slugA=${vb.match.slugA}&slugB=${vb.match.slugB}&format=csv`} target="_blank">Export CSV</a></div></div>
          {!h2h ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">H2H indisponible.</div>
          ) : (
            <div className="text-sm">
              <div className="mb-2 font-medium">{vb.match.playerA}: {h2h.winsA} — {vb.match.playerB}: {h2h.winsB}</div>
              <ul className="list-disc pl-5">
                {h2h.meetings?.map((m: any, i: number) => (
                  <li key={i}>{m.date || ""} · {m.tournament || ""} — <strong>{m.winner || "?"}</strong> {m.score ? `(${m.score})` : ""}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Player stats */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[{title: vb.match.playerA, s: statsA, slug: vb.match.slugA}, {title: vb.match.playerB, s: statsB, slug: vb.match.slugB}].map((p, idx) => (
            <div key={idx} className="card">
              <h4 className="h3 mb-2">{p.title}</h4>
              {!p.s ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">Stats indisponibles.</div>
              ) : (
                <table className="table-auto text-sm w-full">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-white/10">
                      <th className="px-2 py-1">Surface</th>
                      <th className="px-2 py-1">W</th>
                      <th className="px-2 py-1">L</th>
                      <th className="px-2 py-1">Win%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["hard","clay","grass","indoor","overall"].map((surf) => {
                      const s = p.s?.[surf] || { w: 0, l: 0 };
                      const pct = (s.w + s.l) ? ((s.w / (s.w + s.l)) * 100).toFixed(1) : "-";
                      return (
                        <tr key={surf}>
                          <td className="px-2 py-1 capitalize">{surf}</td>
                          <td className="px-2 py-1">{s.w}</td>
                          <td className="px-2 py-1">{s.l}</td>
                          <td className="px-2 py-1">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              <div className="mt-2 text-xs text-gray-500">
                <a className="underline" href={`https://www.tennisexplorer.com/player/${p.slug}/`} target="_blank">Voir la page joueur ↗</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
