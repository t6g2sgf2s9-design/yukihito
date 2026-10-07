import { describe,it,expect } from 'vitest';
import dataset from '../data/generated/events.json';
import type { Answer, EventData } from '../src/types';
import {rankEvents,nextQuestion,questionFor,values,shouldPredict,tooManyUnknowns} from '../src/lib/search/engine';
import {parseFinalTop10} from '../src/lib/bestdori/adapter';
import {normalize,type Masters} from '../src/lib/data/normalize';
import {specialEventIds} from '../src/config/specialEvents';
const events=dataset.events as EventData[];
const target=events.find(e=>e.eventId===259)!;
const answer=(field:Answer['field'],value:string|null,confidence:Answer['confidence']='certain'):Answer=>({field,value,confidence});
describe('検索エンジン・実データ',()=>{
 it('アルス・ノヴァを指定された記憶から最有力にする',()=>{
  const answers=[answer('bannerBandName','Morfonica'),answer('eventScope','band'),answer('year','2024','approximate'),answer('half','first'),answer('bannerCharacter','倉田ましろ'),answer('eventAttribute','pure')];
  const ranked=rankEvents(events,answers);
  expect(ranked[0].event.eventName).toBe('月の森に響く未来へのアルス・ノヴァ');
  expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  expect(shouldPredict(ranked,answers)).toBe(true);
 });
 it('だいたい2024年は前後年を除外せず評価を下げる',()=>{
  const ranked=rankEvents(events,[answer('year','2024','approximate')]);
  for(const year of [2023,2025]) expect(ranked.some(c=>c.event.year===year&&c.probability>0)).toBe(true);
  expect(ranked.find(c=>c.event.year===2024)!.score).toBeGreaterThan(ranked.find(c=>c.event.year===2023)!.score);
 });
 it('わからない連打でも順位計算が安定し、質問を繰り返さず終了できる',()=>{
  const answers:Answer[]=[];const asked=new Set();
  for(let i=0;i<30;i++) { const q=nextQuestion(rankEvents(events,answers),answers);if(!q)break;expect(asked.has(q.field)).toBe(false);asked.add(q.field);answers.push(answer(q.field,null)); }
  expect(nextQuestion(rankEvents(events,answers),answers)).toBeUndefined();
  expect(tooManyUnknowns(answers)).toBe(true);
  expect(rankEvents(events,answers).every(c=>Number.isFinite(c.probability)&&c.score===0)).toBe(true);
 });
 it('予想を外したeventIdは除外され、残りから質問できる',()=>{
  const ranked=rankEvents(events,[],[259]);expect(ranked.some(c=>c.event.eventId===259)).toBe(false);expect(nextQuestion(ranked,[])).toBeDefined();
 });
 it('回答済み・全件同じ・未取得の質問を出さない',()=>{
  const ranked=rankEvents(events,[]);const q=nextQuestion(ranked,[])!;
  expect(nextQuestion(ranked,[answer(q.field,null)])?.field).not.toBe(q.field);
  const twins=rankEvents([target,{...target,eventId:-1}],[]);
  expect(questionFor('bonusCharacters',twins)).toBeUndefined();
  expect(questionFor('stampCharacters',ranked)).toBeUndefined();
 });
 it('候補内の人物だけを追加質問に表示する',()=>{
  const subset=events.filter(e=>e.bannerBandName==='Morfonica');
  const q=questionFor('gachaCharacters',rankEvents(subset,[]))!;
  expect(q).toBeDefined();expect(q.options.every(name=>subset.some(e=>values(e,'gachaCharacters').includes(name)))).toBe(true);
 });
 it('記憶違いでも空候補にならず、全件除外時もクラッシュしない',()=>{
  expect(rankEvents(events,[answer('eventAttribute','nonexistent')])).toHaveLength(events.length);
  const empty=rankEvents(events,[],events.map(e=>e.eventId));expect(empty).toEqual([]);expect(nextQuestion(empty,[])).toBeUndefined();expect(shouldPredict(empty,[])).toBe(false);
 });
 it('特殊イベントIDが実データに存在する',()=>{for(const id of specialEventIds)expect(events.some(e=>e.eventId===id)).toBe(true);});
});
describe('外部データの保護',()=>{
 it('10件の終了後最終記録だけを10位として採用する',()=>{
  const points=Array.from({length:10},(_,i)=>({time:200,value:1000-i*10}));
  expect(parseFinalTop10({points},100)?.points).toBe(910);
  expect(parseFinalTop10({points:points.slice(0,9)},100)).toBeUndefined();
  expect(parseFinalTop10({points},201)).toBeUndefined();
  expect(parseFinalTop10({points:[...points.slice(0,9),{time:200,value:NaN}]},100)).toBeUndefined();
  expect(parseFinalTop10({result:false},100)).toBeUndefined();
 });
 it('欠損マスターと未終了イベントを安全に扱う',()=>{
  const m={events:{'1':{eventName:['test'],startAt:['10'],endAt:['20'],eventType:'story'},'2':{eventName:['future'],startAt:['100'],endAt:['200'],eventType:'story'}},characters:{},bands:{},cards:{},gacha:{},borders:{}} as Masters;
  m.events['3']={} as Masters['events'][string];
  const result=normalize(m,{},50);expect(result).toHaveLength(1);expect(result[0].bannerCharacter).toBeUndefined();expect(result[0].rewardCards).toEqual([]);expect(result[0].star5Era).toBeUndefined();
 });
 it('対象イベントの10位ボーダーは実取得値を保持する',()=>{
  expect(target.top10FinalPoints?.points).toBe(53734475);expect(target.gachas.map(g=>g.id)).toContain(1328);
 });
});
