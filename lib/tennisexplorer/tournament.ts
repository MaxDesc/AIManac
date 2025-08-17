
// lib/tennisexplorer/tournament.ts
import * as cheerio from "cheerio";
import { fetchHtml } from "@/lib/http/fetchHtml";
import { getCache, setCache } from "@/lib/cache/fsCache";

const TTL_14D = 14 * 24 * 3600;

function normalizeSurface(txt: string): "" | "hard" | "clay" | "grass" | "indoors" {
  const t = txt.toLowerCase();
  if (t.includes("indoor")) return "indoors";
  if (t.includes("hard")) return "hard";
  if (t.includes("grass")) return "grass";
  if (t.includes("clay")) return "clay";
  if (t.includes("carpet")) return "indoors"; // often indoor carpet
  return "";
}

/**
 * Scrape la page tournoi TE pour extraire la surface exacte (si dispo).
 * Retourne "" si introuvable.
 */
export async function getTournamentSurface(absUrl: string): Promise<"" | "hard" | "clay" | "grass" | "indoors"> {
  const key = `te:surface:${absUrl}`;
  const cached = await getCache<string | null>(key, TTL_14D);
  if (cached !== null) return (cached || "") as any;

  try {
    const html = await fetchHtml(absUrl);
    const $ = cheerio.load(html);
    let surface = "";

    // Plusieurs endroits possibles: table d'infos, "Surface:" label, etc.
    const infoText = $("body").text().toLowerCase();
    const m = infoText.match(/surface:\s*(hard|clay|grass|indoor[s]?|carpet)/i);
    if (m) {
      surface = normalizeSurface(m[1]);
    } else {
      // heuristique via blocs
      const txt = $(".box, .right, .col, .center").text();
      const mm = txt.match(/surface[^a-z]*(hard|clay|grass|indoor[s]?|carpet)/i);
      if (mm) surface = normalizeSurface(mm[1]);
    }

    await setCache(key, surface || "");
    return (surface || "") as any;
  } catch {
    await setCache(key, "");
    return "";
  }
}
