import * as cheerio from "cheerio";
import { fetchHtml } from "@/lib/http/fetchHtml";
import { getCache, setCache } from "@/lib/cache/fsCache";

export type SurfaceRow = {
  label: string;
  summary?: string;
  clay?: string;
  hard?: string;
  indoors?: string;
  grass?: string;
};

export type ParsedWL = { w: number; l: number; pct: number | null };

export type PlayerSurfaceStats = {
  slug: string;
  name: string;
  country?: string;
  rank?: number | null;
  rows: SurfaceRow[];
  totals: {
    overall: ParsedWL;
    clay: ParsedWL;
    hard: ParsedWL;
    indoors: ParsedWL;
    grass: ParsedWL;
  };
};

function parseWL(text?: string): ParsedWL {
  if (!text || text === "-" || !text.includes("/")) return { w: 0, l: 0, pct: null };
  const [wStr, lStr] = text.split("/").map((s) => s.trim());
  const w = Number(wStr) || 0;
  const l = Number(lStr) || 0;
  const pct = w + l > 0 ? w / (w + l) : null;
  return { w, l, pct };
}

function cleanNum(text?: string | null): number | null {
  if (!text) return null;
  const num = Number(String(text).replace(/[^\d]/g, ""));
  return Number.isFinite(num) && num > 0 ? num : null;
}

const TTL_24H = 24 * 3600;

export async function getPlayerSurfaceStats(slug: string): Promise<PlayerSurfaceStats> {
  const cacheKey = `te:player:${slug}`;
  const cached = await getCache<PlayerSurfaceStats>(cacheKey, TTL_24H);
  if (cached) return cached;

  const url = `https://www.tennisexplorer.com/player/${encodeURIComponent(slug)}/`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const name =
    $("h1").filter((_, el) => $(el).text().toLowerCase().includes("profile"))
      .first()
      .text()
      .replace(/-+\s*profile/i, "")
      .trim() ||
    $(".profile h3, .profile h2").first().text().trim() ||
    slug;

  let country: string | undefined;
  let rank: number | null | undefined = null;

  $(".box .left").find("p").each((_, p) => {
    const t = $(p).text().trim();
    if (t.toLowerCase().startsWith("country:")) {
      country = t.split(":")[1]?.trim();
    }
    if (t.toLowerCase().includes("current/highest rank - singles")) {
      const m = t.match(/singles:\s*([\d]+)\s*\//i);
      if (m) rank = cleanNum(m[1]);
    }
  });

  let rows: SurfaceRow[] = [];
  $("table").each((_, table) => {
    const headers = $(table)
      .find("tr")
      .first()
      .find("th")
      .map((__, th) => $(th).text().trim().toLowerCase())
      .get();

    const hasWanted =
      headers.includes("year") &&
      headers.some((h) => h.includes("summary")) &&
      headers.includes("clay") &&
      headers.includes("hard");

    if (hasWanted) {
      $(table)
        .find("tr")
        .slice(1)
        .each((__, tr) => {
          const tds = $(tr).find("td");
          if (tds.length >= 6) {
            const row: SurfaceRow = {
              label: $(tds[0]).text().trim(),
              summary: $(tds[1]).text().trim(),
              clay: $(tds[2]).text().trim(),
              hard: $(tds[3]).text().trim(),
              indoors: $(tds[4]).text().trim(),
              grass: $(tds[5]).text().trim()
            };
            if (row.label) rows.push(row);
          }
        });
    }
  });

  const sum = rows.find((r) => r.label.toLowerCase().includes("summary"));
  const totals = {
    overall: parseWL(sum?.summary ?? rows[0]?.summary),
    clay: parseWL(sum?.clay ?? rows[0]?.clay),
    hard: parseWL(sum?.hard ?? rows[0]?.hard),
    indoors: parseWL(sum?.indoors ?? rows[0]?.indoors),
    grass: parseWL(sum?.grass ?? rows[0]?.grass)
  };

  const out: PlayerSurfaceStats = {
    slug,
    name: name || slug,
    country,
    rank: rank ?? null,
    rows,
    totals
  };

  await setCache(cacheKey, out);
  return out;
}
