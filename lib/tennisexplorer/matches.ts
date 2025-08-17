
// lib/tennisexplorer/matches.ts
import * as cheerio from "cheerio";
import { fetchHtml } from "@/lib/http/fetchHtml";
import { getTournamentSurface } from "@/lib/tennisexplorer/tournament";

function roundFromText(txt: string): string {
  const t = txt.toLowerCase();
  if (/final(?!ist)/.test(t)) return "Final";
  if (/(semi[-\s]?final|sf)/.test(t)) return "SF";
  if (/(quarter[-\s]?final|qf)/.test(t)) return "QF";
  if (/\br16\b|round of 16/i.test(txt)) return "R16";
  if (/\br32\b|round of 32/i.test(txt)) return "R32";
  if (/\br64\b|round of 64/i.test(txt)) return "R64";
  if (/\b1st|first round|r1\b/i.test(txt)) return "R1";
  if (/\b2nd|second round|r2\b/i.test(txt)) return "R2";
  if (/qual/i.test(t)) return "Qual";
  return "";
}

function parseOdd(s: string): number | null {
  const n = Number(String(s).replace(",", ".").trim());
  return Number.isFinite(n) && n > 1.01 ? n : null;
}

export async function getTEMatches(dateISO?: string) {
  const d = dateISO ? new Date(dateISO) : new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  const url = `https://www.tennisexplorer.com/matches/?type=all&year=${y}&month=${m}&day=${day}`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const out: any[] = [];
  let currentTournament = "";
  let currentTournamentHref = "";
  let currentSurface: "" | "hard" | "clay" | "grass" | "indoors" = "";
  let currentRoundHint = "";

  async function updateTournamentFromHeader($tr: cheerio.Cheerio) {
    currentTournament = $tr.find('td.t-name a').first().text().trim();
    const href = $tr.find('td.t-name a').first().attr("href") || "";
    currentTournamentHref = href ? new URL(href, "https://www.tennisexplorer.com").toString() : "";
    currentRoundHint = $tr.text().trim();
    if (currentTournamentHref) {
      currentSurface = await getTournamentSurface(currentTournamentHref);
    } else {
      currentSurface = "";
    }
  }

  // We need to await updateTournamentFromHeader; collect promises for headers then process rows after
  const headerPromises: Array<Promise<void>> = [];

  // First pass: mark headers and schedule surface fetches
  $("tr.head.flags").each((_, tr) => {
    const $tr = $(tr);
    headerPromises.push(updateTournamentFromHeader($tr));
  });
  await Promise.all(headerPromises);

  // We'll re-iterate while remembering the latest header encountered
  currentTournament = "";
  currentTournamentHref = "";
  currentSurface = "";
  currentRoundHint = "";

  $("tr").each((_, tr) => {
    const $tr = $(tr);

    if ($tr.hasClass("head") && $tr.hasClass("flags")) {
      currentTournament = $tr.find('td.t-name a').first().text().trim();
      const href = $tr.find('td.t-name a').first().attr("href") || "";
      currentTournamentHref = href ? new URL(href, "https://www.tennisexplorer.com").toString() : "";
      currentRoundHint = $tr.text().trim();
      // We won't await surface here; assume it was prefetched above or leave ""
      return;
    }

    const idAttr = $tr.attr("id") || "";
    const main = idAttr.match(/^r(\d+)$/);
    if (!main) return;

    const $tr2 = $tr.next();
    if (!/^r\d+b$/.test($tr2.attr("id") || "")) return;

    const aA = $tr.find('td.t-name a[href*="/player/"], td.t-name a[href*="/doubles-team/"]').first();
    const aB = $tr2.find('td.t-name a[href*="/player/"], td.t-name a[href*="/doubles-team/"]').first();
    const playerA = (aA.text() || "").replace(/\s+/g, " ").trim();
    const playerB = (aB.text() || "").replace(/\s+/g, " ").trim();
    if (!playerA || !playerB) return;

    const hrefA = aA.attr("href") || "";
    const hrefB = aB.attr("href") || "";
    const slugA = (hrefA.match(/\/player\/([a-z0-9-]+)\//i)?.[1] || "") as string;
    const slugB = (hrefB.match(/\/player\/([a-z0-9-]+)\//i)?.[1] || "") as string;

    const timeCell = $tr.find("td.first.time").first().text().trim();
    let start: string | null = null;
    const tm = timeCell.match(/(\d{1,2}):(\d{2})/);
    if (tm) {
      const hh = tm[1].padStart(2, "0");
      const mm = tm[2];
      start = `${y}-${m}-${day}T${hh}:${mm}:00Z`;
    }

    const oddsA = parseOdd($tr.find("td.coursew").first().text().trim() || $tr.find("td.course").first().text().trim());
    const oddsB = parseOdd($tr.find("td.course").first().text().trim() || "");

    const link = $tr.find('a[href*="/match-detail/"]').first().attr("href") || $tr2.find('a[href*="/match-detail/"]').first().attr("href") || "";
    const id = link || `${playerA}-${playerB}-${y}${m}${day}-${main[1]}`;

    const round = roundFromText(currentRoundHint);
    const surface = currentSurface || "";

    out.push({
      id,
      tour: currentTournament,
      round,
      start,
      playerA,
      playerB,
      slugA: slugA || null,
      slugB: slugB || null,
      surface,
      oddsA,
      oddsB,
    });
  });

  // Dedup
  const seen = new Set<string>();
  const dedup = out.filter((m) => {
    const key = `${m.playerA}|${m.playerB}|${m.start || ""}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return dedup;
}
