// lib/tennisexplorer/slug.ts
import * as cheerio from "cheerio";
import { fetchHtml } from "@/lib/http/fetchHtml";
import { getCache, setCache } from "@/lib/cache/fsCache";

const TTL_7D = 7 * 24 * 3600;

export async function resolveTESlugFromName(name: string): Promise<string | null> {
  const key = `te:slug:${name.toLowerCase()}`;
  const cached = await getCache<string | null>(key, TTL_7D);
  if (cached !== null) return cached;

  const q = encodeURIComponent(name);
  const url = `https://www.tennisexplorer.com/search/?q=${q}`;
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const href = $('a[href*="/player/"]')
      .map((_, a) => String($(a).attr("href")))
      .get()
      .find((h) => /\/player\/[a-z0-9-]+\/?$/i.test(h || ""));
    if (!href) {
      await setCache(key, null);
      return null;
    }
    const m = href.match(/\/player\/([a-z0-9-]+)\/?$/i);
    const slug = m?.[1] || null;
    await setCache(key, slug);
    return slug;
  } catch {
    await setCache(key, null);
    return null;
  }
}
