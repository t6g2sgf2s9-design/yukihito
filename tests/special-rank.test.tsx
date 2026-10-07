import { describe,it,expect,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import dataset from '../data/generated/events.json';
import borders from '../data/raw/borders.json';
import type { EventData } from '../src/types';
import { Result } from '../src/components/Result';
import { resolveResultRank } from '../src/lib/data/resultRank';
import { classifyCrowding } from '../src/lib/data/crowding';
import { parseFinalRank } from '../src/lib/bestdori/adapter';
import { specialEventOverrides } from '../src/config/specialEventOverrides';
import * as crowding from '../src/lib/data/crowding';
const events=dataset.events as EventData[],event=events.find(e=>e.eventId===132)!;
const text='このイベントは私、ゆきんこが3位を取ったイベントです🤭';
const render=(e:EventData)=>renderToStaticMarkup(<Result event={e} onReject={()=>{}} onReset={()=>{}}/>);
describe('アインザッツ専用3位表示',()=>{
 it('実ID132を使用し実ランキング3位と既存10位を保持',()=>{
  expect(event.eventName).toBe('新たな旅立ちのアインザッツ');
  expect(resolveResultRank(event).rank).toBe(3);expect(resolveResultRank(event).points?.points).toBe(40000000);expect(event.top10FinalPoints?.points).toBe(25000219);
  expect(parseFinalRank(borders['132'],event.endAt,3)?.points).toBe(40000000);
 });
 it('専用overrideを既存特殊・通常判定より優先',()=>{
  expect(classifyCrowding(event,()=>({level:'sparse',evidence:['test']})).messages).toEqual([text]);
  const html=render(event);expect(html).toContain('🥉 3位');expect(html).toContain('40,000,000');expect(html).toContain(text);
  expect(html).not.toContain('10位ボーダー');expect(html).not.toContain('このイベントの上位は超過密🤭');expect(html).not.toContain('激しい順位争いだった❄️');
 });
 it('画像とコメントをイベント名後・3位前に表示',()=>{
  const html=render(event);expect(html.indexOf('id="result-title"')).toBeLessThan(html.indexOf('yukinator-portrait'));expect(html.indexOf('yukinator-portrait')).toBeLessThan(html.indexOf(text));expect(html.indexOf(text)).toBeLessThan(html.indexOf('🥉 3位'));
 });
 it('他の全342件は10位表示を維持',()=>{for(const e of events.filter(e=>e.eventId!==132)){expect(resolveResultRank(e).rank).toBe(10);expect(resolveResultRank(e).points).toEqual(e.top10FinalPoints);}});
 it('3位欠損時は10位を流用せず未取得',()=>{
  const missing={...event,finalRankPoints:undefined};expect(resolveResultRank(missing).points).toBeUndefined();const html=render(missing);expect(html).toContain('🥉 3位');expect(html).toContain('未取得');expect(html).not.toContain('25,000,219');expect(html).not.toContain('40,000,000');
 });
 it('最終記録ではない／不足件数／不正順位／NaNを採用しない',()=>{
  expect(parseFinalRank({points:[]},event.endAt,3)).toBeUndefined();expect(parseFinalRank(borders['132'],event.endAt,11)).toBeUndefined();expect(parseFinalRank(borders['132'],Date.now(),3)).toBeUndefined();
  expect(parseFinalRank({points:[...borders['132'].points.slice(0,9),null]},event.endAt,3)).toBeUndefined();
  expect(resolveResultRank({...event,finalRankPoints:{3:{points:NaN,observedAt:0,source:'test'}}}).points).toBeUndefined();
 });
 it('検証済みmanual overrideを登録可能',()=>{
  const override=specialEventOverrides[132],previous=override.manualFinalRankPoints;
  try{override.manualFinalRankPoints={points:40000000,observedAt:1605851991937,source:'verified-manual'};expect(resolveResultRank({...event,finalRankPoints:undefined}).points?.source).toBe('verified-manual');}finally{override.manualFinalRankPoints=previous;}
 });
 it('名称を変えてもIDで3位を選択',()=>{expect(resolveResultRank({...event,eventName:'別表記'}).rank).toBe(3);});
 it('コメントなしなら空の枠を作らず名前→ボーダー→詳細を表示',()=>{
  const spy=vi.spyOn(crowding,'classifyCrowding').mockReturnValue({level:'unclassified',classificationSource:'special',messages:[],evidence:[]});
  try{const html=render(event);expect(html).not.toContain('ゆきネーターのイベントコメント');expect(html.indexOf('id="result-title"')).toBeLessThan(html.indexOf('🥉 3位'));expect(html.indexOf('🥉 3位')).toBeLessThan(html.indexOf('class="period"'));}finally{spy.mockRestore();}
 });
});
