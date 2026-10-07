import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { normalize, type Masters } from '../src/lib/data/normalize';
const read=async(name:string)=>JSON.parse(await readFile(`data/raw/${name}.json`,'utf8'));
const m = Object.fromEntries(await Promise.all(['events','cards','characters','bands','gacha'].map(async n=>[n,await read(n)]))) as unknown as Masters;
try { m.borders=await read('borders'); } catch { m.borders={}; }
const overrides=JSON.parse(await readFile('data/overrides/events.json','utf8'));
const events=normalize(m,overrides);
if (!events.length) throw new Error('No valid events; generated data preserved');
await mkdir('data/generated',{recursive:true});
await writeFile('data/generated/events.json',JSON.stringify({generatedAt:new Date().toISOString(),server:'日本版',events},null,2));
console.log(`${events.length} events, ${events.filter(e=>e.top10FinalPoints).length} final T10 borders`);
