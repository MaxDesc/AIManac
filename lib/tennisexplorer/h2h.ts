
// lib/tennisexplorer/h2h.ts
import * as cheerio from "cheerio";
import { fetchHtml } from "@/lib/http/fetchHtml";

/**
 * Retourne H2H résumé + derniers face-à-face (max 10).
 * On utilise l'URL: https://www.tennisexplorer.com/head-to-head/?players=slugA-slugB
 */
export type H2H = {
  winsA: number;
  winsB: number;
  meetings: Array<{
    date?: string;
    tournament?: string;
    winner?: string;
    score?: string;
  }>;
};

export async function getH2H(slugA: string, slugB: string): Promise<H2H | null> {
  try {
    const url = `https://www.tennisexplorer.com/head-to-head/?players=${encodeURIComponent(slugA)}-${encodeURIComponent(slugB)}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const out: H2H = { winsA: 0, winsB: 0, meetings: [] };

    // Heuristique: trouver tableau des meetings
    $("table").each((_, table) => {
      const $t = $(table);
      const head = $t.find("tr").first().text().toLowerCase();
      if (!/head|match|winner|score/.test(head)) return;

      $t.find("tr").slice(1).each((__, tr) => {
        const $tr = $(tr);
        const tds = $tr.find("td");
        if (tds.length < 3) return;
        const textRow = $tr.text().replace(/\s+/g," ").trim().toLowerCase();
        if (!/def|ret|w\/o|walkover|score/.test(textRow) && tds.length < 5) return;

        const date = tds.eq(0).text().trim();
        const tournament = tds.eq(1).text().trim() || tds.eq(2).text().trim();
        const winner = $tr.find("td a[href*='/player/']").first().text().trim();
        const score = tds.last().text().trim();

        if (winner) {
          const wl = winner.toLowerCase();
          if (wl.includes(slugA)) out.winsA += 1;
          else if (wl.includes(slugB)) out.winsB += 1;
        }

        out.meetings.push({ date, tournament, winner, score });
      });
    });

    out.meetings = out.meetings.slice(0, 10);
    return out;
  } catch {
    return null;
  }
}
