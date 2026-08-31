import { prisma } from "@/lib/prisma";

const CACHE_TTL_MS = 30_000;
let cache: { at: number; data: Awaited<ReturnType<typeof loadFresh>> } | null = null;

async function loadFresh() {
  const existing = await prisma.systemSettings.findFirst();
  if (existing) return existing;
  return prisma.systemSettings.create({ data: { id: "singleton" } });
}

export async function getSettings() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  const data = await loadFresh();
  cache = { at: Date.now(), data };
  return data;
}

export function invalidateSettingsCache() {
  cache = null;
}
