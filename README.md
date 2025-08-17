# Tennis IA — Matchs, Value Bets, Stats (Next.js + Tailwind)

## Lancer
```bash
npm i
npm run dev
```

## Brancher ta source de matchs
Édite `app/api/matches/route.ts` pour renvoyer tes matchs avec cotes.
Format attendu par l'UI (liste d'objets) :
```json
{
  "id": "unique",
  "tour": "Challenger X",
  "round": "QF",
  "start": "2025-08-17T12:30:00Z",
  "playerA": "Nom A",
  "playerB": "Nom B",
  "slugA": "slug-te-a",
  "slugB": "slug-te-b",
  "surface": "hard",
  "oddsA": 1.80,
  "oddsB": 2.05
}
```

## Value Bets
L'endpoint `/api/value-bets` appelle `/api/matches`, calcule la proba IA via surfaces+rang,
et sort les sélections où `prob > implied_market` (edge > 0), triées par EV.

## Stats
- `/api/player/[slug]/surfaces` : scraping TennisExplorer (table "Player's record").
- `/api/predict` : proba A vs B via logistique simple (features: winrate overall, winrate surface, rang).
