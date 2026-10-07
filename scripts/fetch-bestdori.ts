import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { endpoints, eventTopUrl, getJson, parseFinalTop10 } from '../src/lib/bestdori/adapter';
const save = (name: string, data: unknown) => writeFile(`data/raw/${name}.json`, JSON.stringify(data));
await mkdir('data/raw', { recursive: true });
const bordersOnly = process.argv.includes('--borders');
if (!bordersOnly) for (const [name,path] of Object.entries(endpoints)) {
 const raw = await getJson(`https://bestdori.com${path}`);
 if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).length < 1) throw new Error(`Invalid master: ${name}`);
 await save(name,raw); console.log(`Saved ${name}`);
 await new Promise(r=>setTimeout(r,200));
}
const events = JSON.parse(await readFile('data/raw/events.json','utf8')) as Record<string,{endAt:(string|null)[]}>;
let cache: Record<string,unknown> = {};
try { cache = JSON.parse(await readFile('data/raw/borders.json','utf8')); } catch { /* first run */ }
// Sequential, cached, rate-limited calls. Updating masters never downloads tracker histories.
const ordered = Object.entries(events).sort(([a],[b]) => Number(b=== '259')-Number(a==='259') || Number(a)-Number(b));
for (const [id,event] of ordered) {
 const end = Number(event.endAt?.[0]);
 const previous=cache[id] as {unavailable?:boolean;checkedAt?:string}|undefined;
 const recentlyMissing=previous?.unavailable&&previous.checkedAt&&Date.now()-Date.parse(previous.checkedAt)<24*3600000;
 if (!end || end > Date.now() || parseFinalTop10(cache[id],end) || recentlyMissing) continue;
 try {
  const raw = await getJson(eventTopUrl(Number(id)));
  const top = parseFinalTop10(raw,end);
  cache[id] = top ? { points: (raw as {points:{time:number;value:number}[]}).points.map(({time,value})=>({time,value})) } : { unavailable: true, checkedAt: new Date().toISOString() };
  await save('borders',cache);
  console.log(`T10 ${id}: ${top?.points ?? 'unavailable'}`);
 } catch (error) { console.warn(`T10 ${id}: ${String(error)}`); }
 await new Promise(r=>setTimeout(r,300));
}
await save('fetch-metadata',{ fetchedAt: new Date().toISOString(),server:0,endpoints });

