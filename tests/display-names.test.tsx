import { describe,it,expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import dataset from '../data/generated/events.json';
import characters from '../data/raw/characters.json';
import { displayCharacterName,displayOption,matchesOptionSearch } from '../src/lib/ui/characterDisplayName';
import { Result } from '../src/components/Result';
import { YukinatorPortrait } from '../src/components/yukinator/YukinatorPortrait';
import { values,rankEvents } from '../src/lib/search/engine';
import type { EventData,Person } from '../src/types';
const events=dataset.events as EventData[];
const names:[number,string,string][]=[[31,'和奏レイ','レイヤ'],[32,'朝日六花','ロック'],[33,'佐藤ますき','マスキング'],[34,'鳰原令王那','パレオ'],[35,'珠手ちゆ','チュチュ']];
describe('RAS表示名だけの上書き',()=>{
 it.each(names)('ID %i %s は %s と表示し、元名は維持',(id,original,display)=>{
  const raw=(characters as Record<string,{characterName:(string|null)[];bandId?:number}>)[id];
  expect(raw.characterName[0]?.replace(/\s/g,'')).toBe(original);expect(raw.bandId).toBe(18);
  const p:Person={id,name:original,bandId:18,bandName:'RAISE A SUILEN'};
  expect(displayCharacterName(p)).toBe(display);expect(p.name).toBe(original);expect(p.id).toBe(id);
  for(const field of ['bannerCharacter','gachaCharacters','star5Characters','bonusCharacters','rewardCharacters','stampCharacters','teamCharacter'] as const)expect(displayOption(field,original)).toBe(display);
  expect(matchesOptionSearch('rewardCharacters',original,display)).toBe(true);expect(matchesOptionSearch('rewardCharacters',original,original)).toBe(true);
 });
 it('人物以外のタイトルや通常人物は書き換えない',()=>{
  expect(displayOption('eventSongs','和奏レイ')).toBe('和奏レイ');expect(displayOption('bannerCharacter','倉田ましろ')).toBe('倉田ましろ');
 });
 it('実RASイベントの検索特徴と回答値は元名のまま',()=>{
  const event=events.find(e=>e.eventId===280)!;
  const original=values(event,'bonusCharacters');expect(original).toContain('和奏レイ');expect(original).not.toContain('レイヤ');
  const before=rankEvents(events,[{field:'bonusCharacters',value:'和奏レイ',confidence:'certain'}]);
  original.map(value=>displayOption('bonusCharacters',value));
  expect(rankEvents(events,[{field:'bonusCharacters',value:'和奏レイ',confidence:'certain'}])).toEqual(before);
 });
 it('バナー・ガチャ・報酬・スタンプの結果表示をIDで統一',()=>{
  const persons=names.map(([id,name])=>({id,name,bandId:18,bandName:'RAISE A SUILEN'}));
  const cards=persons.map((character,i)=>({id:i,character,rarity:5,name:'fixture',type:'permanent'}));
  const event:EventData={...events[0],bannerCharacter:persons[0],gachas:[{id:1,name:'fixture',type:'permanent',cards}],rewardCards:cards,stampCharacters:persons};
  const visible=renderToStaticMarkup(<Result event={event} onReject={()=>{}} onReset={()=>{}}/>).replace(/<[^>]*>/g,'');
  for(const [,original,display] of names){expect(visible).toContain(display);expect(visible).not.toContain(original);}
 });
});
describe('共通画像コンポーネント',()=>{
 it.each(['start','question','guess','result'] as const)('%sは固定の旧寸法・トリミング指定を持たない',variant=>{
  const html=renderToStaticMarkup(<YukinatorPortrait variant={variant}/>);
  expect(html).toContain(`portrait-${variant}`);expect(html).toContain('/yukinator/character.png');expect(html).not.toMatch(/width="633"|height="830"/);
 });
});
