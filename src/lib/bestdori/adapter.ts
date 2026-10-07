// This adapter reflects live responses checked on 2026-10-07, not a promised API contract.
export const endpoints = {
 events: '/api/events/all.5.json', cards: '/api/cards/all.5.json', characters: '/api/characters/all.2.json',
 bands: '/api/bands/all.1.json', gacha: '/api/gacha/all.5.json', songs: '/api/songs/all.7.json', stamps: '/api/stamps/all.2.json',
};
export const eventTopUrl = (id: number) => `https://bestdori.com/api/eventtop/data?server=0&event=${id}&mid=0&latest=1`;
export interface TopPoint { time: number; value: number }
export function parseFinalTop10(raw: unknown, endAt: number): { points: number; observedAt: number } | undefined {
 return parseFinalRank(raw,endAt,10);
}
export function parseFinalRank(raw: unknown, endAt: number, rank:number): { points:number; observedAt:number } | undefined {
 if(!Number.isInteger(rank)||rank<1||rank>10)return;
 if (!raw || typeof raw !== 'object' || !('points' in raw) || !Array.isArray(raw.points)) return;
 const points = raw.points as TopPoint[];
 if (points.length !== 10 || !points.every(p => p && typeof p==='object' && Number.isSafeInteger(p.value) && p.value >= 0 && Number.isFinite(p.time) && p.time >= endAt)) return;
 // latest=1 response contains one final snapshot, ordered by points. No player identities are retained.
 if (new Set(points.map(p => p.time)).size !== 1) return;
 return { points: [...points].sort((a,b)=>b.value-a.value)[rank-1].value, observedAt: points[0].time };
}
export async function getJson(url: string): Promise<unknown> {
 for (let attempt=0; attempt<3; attempt++) {
  try { const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
   if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
   return await response.json();
  } catch (error) { if (attempt === 2) throw error; await new Promise(r=>setTimeout(r,1000*(attempt+1))); }
 }
 throw new Error('Unreachable');
}
