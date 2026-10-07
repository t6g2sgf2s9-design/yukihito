import type { EventData, Person, Card, Gacha } from '../../types';
import { parseFinalTop10, parseFinalRank, eventTopUrl } from '../bestdori/adapter';
import { specialEventOverrides } from '../../config/specialEventOverrides';
type Localized = (string|null)[];
interface RawEvent { eventName: Localized; startAt: Localized; endAt: Localized; eventType: string; attributes?: {attribute:string}[]; characters?: {characterId:number}[]; rewardCards?: number[]; members?: {situationId:number}[] }
interface RawCharacter { characterName: Localized; bandId: number }
interface RawCard { characterId: number; rarity: number; prefix: Localized; type: string; releasedAt: Localized; attribute?: string }
interface RawGacha { gachaName: Localized; type:string; publishedAt:Localized; newCards?: number[] }
export interface Override { bannerCharacterId?: number; eventScope?: 'band'|'mixed'; gachaIds?: number[]; eventSongs?: string[]; eventSongBands?: string[]; memoryTags?: Record<string,string[]>; stampCharacterIds?: number[]; seasonTags?: string[]; collaborationTag?: string; sources?: string[]; notes?: string[] }
export interface Masters { events:Record<string,RawEvent>; characters:Record<string,RawCharacter>; bands:Record<string,{bandName:Localized}>; cards:Record<string,RawCard>; gacha:Record<string,RawGacha>; borders:Record<string,unknown> }
export function normalize(m: Masters, overrides: Record<string,Override>, now=Date.now()): EventData[] {
 const person=(id:number): Person | undefined => { const c=m.characters[id]; return c?.characterName?.[0] ? {id,name:c.characterName[0].replace(/\s/g,''),bandId:c.bandId,bandName:m.bands[c.bandId]?.bandName?.[0] ?? '不明'} : undefined; };
 const card=(id:number): Card | undefined => { const c=m.cards[id]; const p=c && person(c.characterId); return c && p ? {id,character:p,rarity:c.rarity,name:c.prefix?.[0]??'名称未取得',type:c.type,attribute:c.attribute} : undefined; };
 const defined=<T>(x:T|undefined):x is T=>x!==undefined;
 const star5Dates=Object.values(m.cards).filter(c=>c.rarity===5&&Number(c.releasedAt?.[0])>0).map(c=>Number(c.releasedAt[0]));
 const star5Start=star5Dates.length?Math.min(...star5Dates):undefined;
 return Object.entries(m.events).flatMap(([id,r])=>{
  const startAt=Number(r.startAt?.[0]),endAt=Number(r.endAt?.[0]);
  if(!r.eventName?.[0]||!Number.isSafeInteger(startAt)||!Number.isSafeInteger(endAt)||!startAt||endAt<=startAt||endAt>now) return [];
  const o=overrides[id]??{};
  const bonusCharacters=(r.characters??[]).map(c=>person(c.characterId)).filter(defined);
  const bands=new Set(bonusCharacters.map(c=>c.bandId));
  const scope=o.eventScope ?? (bonusCharacters.length===5&&bands.size===1?'band':bands.size>1?'mixed':undefined);
  const banner=o.bannerCharacterId?person(o.bannerCharacterId):undefined;
  // Only explicitly selected gacha or matches sharing event bonus member card IDs.
  // Time overlap alone is deliberately insufficient to assert an event relationship.
  const memberIds=new Set((r.members??[]).map(c=>c.situationId));
  const inferred=Object.entries(m.gacha).filter(([,g])=>g.gachaName?.[0]&&Number(g.publishedAt?.[0])===startAt&&(g.newCards??[]).some(c=>memberIds.has(c))).map(([gid])=>Number(gid));
  const gachas:Gacha[]=(o.gachaIds??inferred).flatMap(gid=>{const g=m.gacha[gid];return g?.gachaName?.[0]?[{id:gid,name:g.gachaName[0],type:g.type,cards:(g.newCards??[]).map(card).filter(defined)}]:[];});
  const date=new Date(startAt+9*3600000);
  const border=parseFinalTop10(m.borders[id],endAt);
  const rank=specialEventOverrides[Number(id)]?.resultRank;
  const rankedPoints=rank?parseFinalRank(m.borders[id],endAt,rank):undefined;
  const finalRankPoints=rank&&rankedPoints?{[rank]:{...rankedPoints,source:eventTopUrl(Number(id))}}:undefined;
  return [{eventId:Number(id),eventName:r.eventName[0],startAt,endAt,year:date.getUTCFullYear(),half:date.getUTCMonth()<6?'first':'second',bannerCharacter:banner,bannerBandName:banner?.bandName??(scope==='band'?bonusCharacters[0]?.bandName:undefined),eventScope:scope,scopeBasis:o.eventScope?'手動補完':'ボーナス対象の所属から暫定分類',eventAttribute:r.attributes?.length===1?r.attributes[0].attribute:undefined,eventFormat:r.eventType,bonusCharacters,rewardCards:(r.rewardCards??[]).map(card).filter(defined),gachas,gachaBasis:o.gachaIds?'手動照合':'開始時刻とイベントボーナスカードの一致から関連候補',eventSongs:o.eventSongs??[],eventSongBands:o.eventSongBands??[],memoryTags:o.memoryTags,stampCharacters:(o.stampCharacterIds??[]).map(person).filter(defined),star5Era:star5Start===undefined?undefined:startAt>=star5Start,seasonTags:o.seasonTags??[],collaborationTag:o.collaborationTag,limited:gachas.length?gachas.some(g=>g.type==='limited')?'limited':gachas.every(g=>g.type==='permanent')?'permanent':undefined:undefined,finalRankPoints,top10FinalPoints:border?{...border,source:eventTopUrl(Number(id))}:undefined,sources:[`https://bestdori.com/api/events/${id}.json`,...(o.sources??[])],notes:o.notes??[]}];
 });
}


