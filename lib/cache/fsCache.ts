
// lib/cache/fsCache.ts
import { promises as fs } from "node:fs";
import path from "node:path";

const CACHE_DIR = path.join(process.cwd(), ".cache");

async function ensureDir() {
  try { await fs.mkdir(CACHE_DIR, { recursive: true }); } catch {}
}

function fileForKey(key: string) {
  // sanitize key -> filename
  const safe = key.replace(/[^a-z0-9._-]+/gi, "_").slice(0, 200);
  return path.join(CACHE_DIR, safe + ".json");
}

export async function getCache<T = any>(key: string, ttlSeconds: number): Promise<T | null> {
  await ensureDir();
  const fp = fileForKey(key);
  try {
    const raw = await fs.readFile(fp, "utf8");
    const obj = JSON.parse(raw);
    const age = (Date.now() - (obj.ts || 0)) / 1000;
    if (age <= ttlSeconds) return obj.value as T;
  } catch {}
  return null;
}

export async function setCache<T = any>(key: string, value: T): Promise<void> {
  await ensureDir();
  const fp = fileForKey(key);
  const payload = JSON.stringify({ ts: Date.now(), value });
  await fs.writeFile(fp, payload, "utf8");
}
