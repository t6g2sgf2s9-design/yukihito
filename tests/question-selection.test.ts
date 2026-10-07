import { describe,it,expect } from 'vitest';
import dataset from '../data/generated/events.json';
import type { Answer,Candidate,EventData,Field,Person,Card } from '../src/types';
import { initialQuestions, questionDefinitions } from '../src/config/questions';
import { rankEvents, nextQuestion, questionFor, values, shouldPredict, decideNextStep, updateMemoryProfile, predictionDiagnostics } from '../src/lib/search/engine';
const base=dataset.events.find(e=>e.eventId===259)! as EventData;
const answer=(field:Field,value:string|null,confidence:Answer['confidence']='certain'):Answer=>({field,value,confidence});
const initialDone=initialQuestions.map(f=>answer(f,null));
const fixture=(id:number,changes:Partial<EventData>={}):EventData=>({...base,eventId:id,...changes});
const pair=()=>rankEvents([fixture(9001,{eventFormat:'mission_live'}),fixture(9002,{eventFormat:'versus'})],[]);
const person=(id:number):Person=>({id,name:`テスト人物${id}`,bandId:21,bandName:'Morfonica'});
const card=(id:number,rarity=5,attribute='pure'):Card=>({id,character:person(id),rarity,attribute,name:'テストカード',type:'permanent'});
describe('質問継続と1件予想',()=>{
 it('上位が僅差なら追加質問する',()=>{
  const ranked=pair();ranked[0].score=.1;ranked[1].score=0;
  expect(shouldPredict(ranked,initialDone)).toBe(false);expect(decideNextStep(ranked,initialDone).type).toBe('question');
 });
 it('少数候補でも強い識別質問があれば継続する',()=>{
  const ranked=pair();const question=nextQuestion(ranked,initialDone)!;
  expect(question.field).toBe('eventFormat');expect(question.diagnostics.topDiscrimination).toBe(1);expect(question.gain).toBeGreaterThan(.25);
  expect(decideNextStep(ranked,initialDone).type).toBe('question');
 });
 it('十分な差とconfidenceがあるなら予想できる',()=>{
  const ranked=pair();ranked[0]={...ranked[0],score:9,probability:.995};ranked[1]={...ranked[1],score:0,probability:.005};
  const answers=[answer('year','2024'),answer('half','first')];
  expect(shouldPredict(ranked,answers)).toBe(true);expect(decideNextStep(ranked,answers).type).toBe('guess');
 });
 it('わからない5連打で一覧へ移行しない',()=>{
  const answers=[...initialDone,answer('eventAttribute',null)];
  expect(decideNextStep(pair(),answers).type).toBe('question');
 });
 it('全質問が尽きたら複数候補でも最高スコア1件を予想',()=>{
  const answers=[...initialDone,answer('eventFormat',null)];
  const ranked=pair();const step=decideNextStep(ranked,answers);
  expect(nextQuestion(ranked,answers)).toBeUndefined();expect(step.type).toBe('guess');
  if(step.type==='guess')expect(step.candidate.event.eventId).toBe(ranked[0].event.eventId);
 });
 it('同一データの候補でも最初は一覧でなく1件を予想',()=>{
  const ranked=rankEvents([fixture(9001),fixture(9002)],[]);
  expect(decideNextStep(ranked,[]).type).toBe('guess');
 });
 it('これじゃないで除外後、残りの識別質問を続ける',()=>{
  const fixtures=[fixture(9001,{eventFormat:'story'}),fixture(9002,{eventFormat:'versus'}),fixture(9003,{eventFormat:'medley'})];
  const first=rankEvents(fixtures,[])[0].event.eventId;
  const ranked=rankEvents(fixtures,initialDone,[first]);
  expect(ranked.some(c=>c.event.eventId===first)).toBe(false);expect(decideNextStep(ranked,initialDone,1).type).toBe('question');
 });
 it('質問が尽きても外れが3回未満なら次の1件を予想する',()=>{
  const ranked=pair(),answers=[...initialDone,answer('eventFormat',null)];
  expect(decideNextStep(ranked,answers,1).type).toBe('guess');expect(decideNextStep(ranked,answers,2).type).toBe('guess');expect(decideNextStep(ranked,answers,3).type).toBe('rescue');
 });
 it('3回外しても有効質問があれば一覧にしない',()=>{expect(decideNextStep(pair(),initialDone,3).type).toBe('question');});
 it('全候補除外は空状態で安全に終了',()=>{expect(decideNextStep([],initialDone).type).toBe('empty');});
 it('質問枯渇と多数の完全同率と3回の外れが揃った場合だけ一覧救済',()=>{
  const ranked=rankEvents(Array.from({length:20},(_,i)=>fixture(9000+i)),[]);
  expect(decideNextStep(ranked,[],2).type).toBe('guess');expect(decideNextStep(ranked,[],3)).toEqual({type:'rescue',reason:'exhausted-ties'});
 });
});
describe('実イベントの動的検索経路',()=>{
 it.each([259,280,342])('eventId %i を通常の質問回答から最初の予想にする',id=>{
  const events=dataset.events as EventData[],target=events.find(e=>e.eventId===id)!;
  const answers:Answer[]=[];
  for(let i=0;i<questionDefinitions.length+1;i++){
   const step=decideNextStep(rankEvents(events,answers),answers);
   expect(step.type).not.toBe('rescue');
   if(step.type==='guess'){expect(step.candidate.event.eventId).toBe(id);return;}
   expect(step.type).toBe('question');if(step.type!=='question')throw new Error('Unexpected search state');
   const value=values(target,step.question.field).find(v=>step.question.options.includes(v))??null;
   answers.push(answer(step.question.field,value,step.question.field==='year'?'approximate':'certain'));
  }
  throw new Error('Failed to guess after exhausting the finite question pool');
 });
});
describe('記憶プロファイルと質問価値',()=>{
 it('不明カテゴリのanswerabilityが大きく下がる',()=>{
  expect(updateMemoryProfile([answer('eventFormat',null)]).format.answerabilityMultiplier).toBeLessThan(.5);
 });
 it('明確に答えたカテゴリのanswerabilityが上がる',()=>{
  expect(updateMemoryProfile([answer('rewardCharacters','桐ヶ谷透子')]).reward.answerabilityMultiplier).toBeGreaterThan(1);
 });
 it('ガチャを覚えている人には関連質問の価値を上げられる',()=>{
  const a=fixture(9001,{gachas:[{id:1,name:'fixture',type:'permanent',cards:[card(1,5),card(2,4)]}],rewardCards:[card(3)]});
  const b=fixture(9002,{gachas:[{id:2,name:'fixture',type:'permanent',cards:[card(2,5),card(1,4)]}],rewardCards:[card(4)]});
  const ranked=rankEvents([a,b],[]);
  const before=questionFor('star5Characters',ranked)!;
  const after=questionFor('star5Characters',ranked,[answer('gachaCharacters','テスト人物1')])!;
  expect(after.diagnostics.answerability).toBeGreaterThan(before.diagnostics.answerability);expect(after.gain).toBeGreaterThan(before.gain);
  expect(nextQuestion(ranked,[...initialDone,answer('gachaCharacters','テスト人物1')])?.field).toBe('star5Characters');
 });
 it('形式不明を再質問せず、同じ特徴の別表現も抑止',()=>{
  expect(nextQuestion(pair(),[...initialDone,answer('eventFormat',null)])).toBeUndefined();
  const ranked=rankEvents([fixture(1,{eventAttribute:'pure'}),fixture(2,{eventAttribute:'cool'})],[]);
  expect(questionFor('teamAttribute',ranked,[answer('eventAttribute',null)])).toBeUndefined();
 });
 it('回答済み質問を返さず、類似質問の重複ペナルティを付ける',()=>{
  const ranked=pair();expect(questionFor('eventFormat',ranked,[answer('eventFormat',null)])).toBeUndefined();
  const memory=updateMemoryProfile([answer('gachaCharacters',null)]);expect(memory.gacha.answerabilityMultiplier).toBe(.3);
 });
 it('上位2件の分割を質問診断値へ反映',()=>{
  const q=questionFor('eventFormat',pair())!;expect(q.diagnostics.topDiscrimination).toBe(1);expect(q.diagnostics.relevance).toBe(2.5);expect(q.diagnostics.dataCoverage).toBe(1);
 });
 it('欠損の多い質問を網羅率で割り引く',()=>{
  const ranked=rankEvents([fixture(1,{eventSongs:['A']}),fixture(2,{eventSongs:['B']}),fixture(3,{eventSongs:[]}),fixture(4,{eventSongs:[]})],[]);
  expect(questionFor('eventSongs',ranked)!.diagnostics.dataCoverage).toBe(.5);
 });
 it('追加カード属性は候補内の実データのみ使う',()=>{
  const ranked=rankEvents([fixture(1,{rewardCards:[card(1,3,'pure')]}),fixture(2,{rewardCards:[card(2,3,'cool')]})],[]);
  expect(questionFor('rewardAttributes',ranked)!.options).toEqual(['cool','pure']);
  expect(values(fixture(3,{eventSongBands:[]}),'eventSongBands')).toEqual([]);
 });
 it('編成の手がかりは通常属性回答より弱く評価する',()=>{
  const a=fixture(1,{eventAttribute:'pure'}),b=fixture(2,{eventAttribute:'cool'});
  const regular=rankEvents([a,b],[answer('eventAttribute','pure')]);const team=rankEvents([a,b],[answer('teamAttribute','pure')]);
  expect(team[0].score-team[1].score).toBeLessThan(regular[0].score-regular[1].score);
 });
 it('主観タグは定義追加だけで質問できる',()=>{
  questionDefinitions.push({field:'tag:school',text:'学校中心だった？',category:'theme',answerabilityWeight:.7,reliabilityWeight:.6});
  try{const ranked=rankEvents([fixture(1,{memoryTags:{school:['yes']}}),fixture(2,{memoryTags:{school:['no']}})],[]);expect(questionFor('tag:school',ranked)?.options).toEqual(['no','yes']);}finally{questionDefinitions.pop();}
 });
 it('診断でconfidence・首位との差・最大質問価値が見られる',()=>{
  const d=predictionDiagnostics(pair(),initialDone);expect(d.topConfidence).toBe(.5);expect(d.scoreGap).toBe(0);expect(d.maxQuestionScore).toBeGreaterThan(0);
 });
});
