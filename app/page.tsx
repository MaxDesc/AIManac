"use client";

import { useEffect, useMemo, useState } from "react";
import RowProb from "@/components/RowProb";
import { FeatureCard } from "@/components/FeatureCard";
import ThemeToggle from "@/components/ThemeToggle";

type Features = { winrate_overall: number; winrate_surface: number; rank_score: number };
type PredictResp = {
  surface: "clay" | "hard" | "indoors" | "grass";
  players: {
    A: { slug: string; name: string; rank: number | null; features: Features };
    B: { slug: string; name: string; rank: number | null; features: Features };
  };
  probabilities: { A: number; B: number };
  implied_odds: { A: number; B: number };
};
type MatchLite = {
  id: string | number;
  tour?: string; round?: string; start?: string;
  playerA?: string; playerB?: string; surface?: string;
  slugA?: string; slugB?: string;
  oddsA?: number | null; oddsB?: number | null;
};
type ValueBet = {
  id: string | number;
  match: MatchLite;
  side: "A" | "B";
  prob: number;
  odds: number;
  edge: number;
  ev: number;
};

const SURFACES = ["hard", "clay", "indoors", "grass"] as const;

export default function HomePage() {
  const [tab, setTab] = useState<"matches" | "value" | "stats">("value");

  // Predict demo (for Stats compare)
  const [playerA, setPlayerA] = useState("castagnola");
  const [playerB, setPlayerB] = useState("bilozerstev");
  const [surface, setSurface] = useState<(typeof SURFACES)[number]>("hard");
  const [pred, setPred] = useState<PredictResp | null>(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predErr, setPredErr] = useState<string | null>(null);

  // Matches
  const [matches, setMatches] = useState<MatchLite[]>([]);
  const [mLoading, setMLoading] = useState(false);
  const [q, setQ] = useState("");

  // Value Bets
  const [values, setValues] = useState<ValueBet[]>([]);
  const [vLoading, setVLoading] = useState(false);

  const fetchPredict = async () => {
    setPredLoading(true);
    setPredErr(null);
    setPred(null);
    try {
      const url = `/api/predict?playerA=${encodeURIComponent(playerA)}&playerB=${encodeURIComponent(playerB)}&surface=${surface}`;
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Fetch failed");
      setPred(json);
    } catch (e: any) {
      setPredErr(e?.message || "Erreur inconnue");
    } finally {
      setPredLoading(false);
    }
  };

  const fetchMatches = async () => {
    setMLoading(true);
    try {
      const res = await fetch("/api/matches", { cache: "no-store" });
      if (!res.ok) {
        setMatches([]);
      } else {
        const json = await res.json();
        setMatches(Array.isArray(json) ? json : json?.matches || []);
      }
    } catch {
      setMatches([]);
    } finally {
      setMLoading(false);
    }
  };

  const refreshValues = async () => {
    setVLoading(true);
    try {
      const res = await fetch("/api/value-bets", { cache: "no-store" });
      const json = await res.json();
      setValues(Array.isArray(json) ? json : json?.values || []);
    } catch {
      setValues([]);
    } finally {
      setVLoading(false);
    }
  };

  const winner = useMemo(() => {
    if (!pred) return null;
    return pred.probabilities.A >= pred.probabilities.B ? "A" : "B";
  }, [pred]);

  const filteredMatches = useMemo(() => {
    if (!q.trim()) return matches;
    const s = q.toLowerCase();
    return matches.filter(
      (m) =>
        (m.playerA || "").toLowerCase().includes(s) ||
        (m.playerB || "").toLowerCase().includes(s) ||
        (m.tour || "").toLowerCase().includes(s) ||
        (m.round || "").toLowerCase().includes(s)
    );
  }, [matches, q]);

  useEffect(() => {
    fetchPredict();
    fetchMatches();
    refreshValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_20%_20%,rgba(99,102,241,0.15),transparent_60%),radial-gradient(600px_circle_at_80%_10%,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-14 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="h1">🎾 Tennis IA — Matchs, Value Bets, Stats</h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="glass rounded-full px-3 py-1.5 text-sm">
                <span className="badge bg-emerald-100 text-emerald-800 mr-2">IA</span>
                Détection de Value Bets, analyses surfaces & rang
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 inline-flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
            <button
              className={`px-4 py-2 rounded-xl text-sm transition ${tab === "value" ? "bg-black text-white dark:bg-brand-500" : "hover:bg-gray-50 dark:hover:bg-white/10"}`}
              onClick={() => setTab("value")}
            >Value Bet</button>
            <button
              className={`px-4 py-2 rounded-xl text-sm transition ${tab === "matches" ? "bg-black text-white dark:bg-brand-500" : "hover:bg-gray-50 dark:hover:bg-white/10"}`}
              onClick={() => setTab("matches")}
            >Match du jour</button>
            <button
              className={`px-4 py-2 rounded-xl text-sm transition ${tab === "stats" ? "bg-black text-white dark:bg-brand-500" : "hover:bg-gray-50 dark:hover:bg-white/10"}`}
              onClick={() => setTab("stats")}
            >Stats</button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 pb-14 space-y-8">
        {tab === "value" && (
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="h2">Value Bets détectés</h2>
              <div className="flex items-center gap-2">
                <button className="btn btn-primary" onClick={refreshValues}>
                  {vLoading ? "Analyse..." : "Rafraîchir"}
                </button>
                <a className="btn" href="/api/value-bets?format=csv" target="_blank" rel="noreferrer">Export CSV</a>
              </div>
            </div>

            {vLoading && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-1/3 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            )}

            {!vLoading && values.length === 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                Aucun value bet détecté. Branche des cotes dans <code className="mono">/api/matches</code>.
              </div>
            )}

            {!vLoading && values.length > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {values.map((v) => (
                  <div key={String(v.id)} className="card">
                    <div className="flex items-center justify-between">
                      <div className="badge bg-indigo-100 text-indigo-800 dark:bg-brand-500/20 dark:text-brand-200">
                        EV {(v.ev * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">{v.match.start ? new Date(v.match.start).toLocaleString() : "—"}</div>
                    </div>
                    <div className="mt-2 font-medium">
                      {v.match.playerA} vs {v.match.playerB}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {(v.match.tour || "—") + (v.match.round ? ` · ${v.match.round}` : "")}
                    </div>
                    <div className="mt-2 text-sm">
                      Sélection: <b>{v.side === "A" ? v.match.playerA : v.match.playerB}</b> @ <b>{v.odds}</b> — Prob. IA {(v.prob * 100).toFixed(1)}%
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Edge {(v.edge * 100).toFixed(1)}% (IA {(v.prob * 100).toFixed(1)}% vs marché {(100 / v.odds).toFixed(1)}%)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "matches" && (
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="h2">Matchs du jour</h2>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Recherche par joueur, tournoi, round. Lecture de <code className="mono">/api/matches</code>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input className="input w-72" placeholder="Filtrer…" value={q} onChange={(e) => setQ(e.target.value)} />
                <button onClick={fetchMatches} className="btn btn-primary" disabled={mLoading}>
                  {mLoading ? "Rafraîchit..." : "Rafraîchir"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-1/3 bg-gray-200 rounded" />
                  </div>
                ))}

              {!mLoading && filteredMatches.length === 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Aucun match. Branche ton backend sur <code className="mono">/api/matches</code>.
                </div>
              )}

              {filteredMatches.map((m) => (
                <div key={String(m.id)} className="card">
                  <div className="flex items-center justify-between">
                    <div className="badge bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200">{m.surface || "—"}</div>
                    <div className="text-xs text-gray-500">{m.start ? new Date(m.start).toLocaleString() : "—"}</div>
                  </div>
                  <div className="mt-2 font-medium">
                    {(m.playerA || "—")} vs {(m.playerB || "—")}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {(m.tour || "—") + (m.round ? ` · ${m.round}` : "")}
                  </div>
                  <div className="mt-2 text-sm mono">
                    {m.oddsA && m.oddsB ? `Cotes: ${m.oddsA} / ${m.oddsB}` : "Cotes: —"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "stats" && (
          <>
            <div className="card">
              <h2 className="h2 mb-3">Comparer deux joueurs</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Joueur A (slug TE)</label>
                  <input className="input" value={playerA} onChange={(e) => setPlayerA(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Joueur B (slug TE)</label>
                  <input className="input" value={playerB} onChange={(e) => setPlayerB(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Surface</label>
                  <select className="select" value={surface} onChange={(e) => setSurface(e.target.value as any)}>
                    {SURFACES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <button onClick={fetchPredict} className="btn btn-primary" disabled={predLoading}>
                  {predLoading ? "Calcul..." : "Prédire"}
                </button>
                {predErr && <span className="text-red-600 text-sm ml-3">{predErr}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <h2 className="h2">Probabilités — <span className="uppercase">{pred?.surface ?? surface}</span></h2>
                  {pred && (
                    <span className="badge bg-indigo-100 text-indigo-800 dark:bg-brand-500/20 dark:text-brand-200">
                      Cotes imp. A: {pred.implied_odds.A} · B: {pred.implied_odds.B}
                    </span>
                  )}
                </div>
                {!pred && !predLoading && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">Lance une prédiction pour voir le résultat.</div>
                )}
                {pred && (
                  <div className="mt-4 space-y-3">
                    <RowProb label={`${pred.players.A.name} (${pred.players.A.slug})`} value={pred.probabilities.A} highlight={pred.probabilities.A >= pred.probabilities.B} />
                    <RowProb label={`${pred.players.B.name} (${pred.players.B.slug})`} value={pred.probabilities.B} highlight={pred.probabilities.B > pred.probabilities.A} />
                    <div className="mt-2 text-sm">
                      Favori: <b>{pred.probabilities.A >= pred.probabilities.B ? pred.players.A.name : pred.players.B.name}</b>
                    </div>
                  </div>
                )}
              </div>

              <div className="card">
                <h2 className="h2 mb-3">Features</h2>
                {!pred ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">Aucune feature à afficher.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <FeatureCard title={pred.players.A.name} rank={pred.players.A.rank} overall={pred.players.A.features.winrate_overall} surface={pred.players.A.features.winrate_surface} />
                    <FeatureCard title={pred.players.B.name} rank={pred.players.B.rank} overall={pred.players.B.features.winrate_overall} surface={pred.players.B.features.winrate_surface} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
