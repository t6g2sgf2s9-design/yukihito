import { describe,it,expect,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import dataset from '../data/generated/events.json';
import raw from '../data/raw/events.json';
import { comments } from '../src/config/comments';
import { specialEventIds } from '../src/config/specialEvents';
import { classifyCrowding } from '../src/lib/data/crowding';
import { pickQuestionPrompt } from '../src/lib/ui/questionPrompt';
import { Result } from '../src/components/Result';
import type { EventData } from '../src/types';
const events=dataset.events as EventData[];
const original=['このイベントの上位は超過密🤭','激しい順位争いだった❄️'];
const cases:[number,string,string[]][]=[
 [298,'Baby steps!',original],[280,"Rockin' Our Trip!",original],
 [171,'「そんな人じゃないんです！」',original],[170,'聖夜に集うSnow Rose',original],
 [132,'新たな旅立ちのアインザッツ',['このイベントは私、ゆきんこが3位を取ったイベントです🤭']],[342,'未来想送曲',original],
 [293,'Secret 1Day Andante',['1位と友達なんだよね🤭']],
 [318,'あなたを照らすオーバード',['1位と友達なんだよね🤭']],
 [275,'探検！体験！ワクワクアクアリウム！',['りんちゃんは孤独に弱いね🤭']],
 [259,'月の森に響く未来へのアルス・ノヴァ',['10取るには美味しいイベントだよね！','こんなイベント走りたかったなー🤭']],
 [271,'マシロ・イン・ワンダーランド',['海外から参加してた猛者がいるらしいよ🤭']],
];
describe('質問セリフ',()=>{
 it('指定3種類を設定で管理し、旧セリフが含まれない',()=>{
  expect(comments.questionPrompts).toEqual(['これはどうかな？','おぼえてる？','なんだろう？']);
  expect(JSON.stringify(comments)).not.toContain('これはどうでもいいか');
 });
 it('どの前回セリフでも直前と同じものを選ばない',()=>{
  for(const previous of comments.questionPrompts)for(const random of [0,.49,.99,1]){
   const next=pickQuestionPrompt(previous,()=>random);
   expect(comments.questionPrompts).toContain(next);expect(next).not.toBe(previous);
  }
 });
 it('連続100問でも設定内で抽選し、隣接するセリフが重複しない',()=>{
  let previous:string|undefined;
  for(let i=0;i<100;i++){const next=pickQuestionPrompt(previous,()=>i%10/10);expect(comments.questionPrompts).toContain(next);expect(next).not.toBe(previous);previous=next;}
 });
});
describe('11イベントの専用コメントと実ID',()=>{
 it('特殊対象は合計11件',()=>{expect(specialEventIds.size).toBe(11);});
 it.each(cases)('eventId %i %s の文言を正しく解決し通常判定を呼ばない',(id,name,lines)=>{
  const event=events.find(e=>e.eventId===id)!;
  expect(event.eventName).toBe(name);expect((raw as Record<string,{eventName:(string|null)[]}>)[id].eventName[0]).toBe(name);
  const classifier=vi.fn(()=>({level:'sparse' as const,evidence:['comparison']}));
  const result=classifyCrowding(event,classifier);
  expect(result.classificationSource).toBe('special');expect(result.messages).toEqual(lines);expect(classifier).not.toHaveBeenCalled();
 });
 it('イベント名を変えてもIDで専用コメントを解決する',()=>{
  expect(classifyCrowding({...events.find(e=>e.eventId===293)!,eventName:'別表記'}).messages).toEqual(['1位と友達なんだよね🤭']);
 });
 it.each(cases)('eventId %i の結果には実コメントだけを表示する',(id,_name,lines)=>{
  const event=events.find(e=>e.eventId===id)!;
  const html=renderToStaticMarkup(<Result event={event} onReject={()=>{}} onReset={()=>{}}/>);
  const visible=html.replace(/<[^>]*>/g,'');
  for(const line of lines)expect(visible).toContain(line);
  expect(visible).not.toMatch(/fallback|classificationSource|special|normal|crowded|sparse|特殊判定|専用コメント|特殊コメント|通常判定|仕様書で指定|目安だヨ|お決まりコメント|分からない時のコメント|データ不足時コメント/);
  expect(visible).not.toContain(comments.crowded);expect(visible).not.toContain(comments.sparse);
  for(const line of lines)expect(html).toContain(`<p>${line}</p>`);
 });
 it('通常イベントの情報欠損時も過疎コメントのみで、説明を表示しない',()=>{
  const event={...events.find(e=>e.eventId===343)!,bannerCharacter:undefined};
  expect(classifyCrowding(event).messages).toEqual([comments.sparse]);
  const html=renderToStaticMarkup(<Result event={event} onReject={()=>{}} onReset={()=>{}}/>);
  const visible=html.replace(/<[^>]*>/g,'');expect(visible).toContain(comments.sparse);expect(visible).not.toContain(comments.unknown);expect(visible).not.toMatch(/目安だヨ|お決まりコメント|fallback|classificationSource/);
 });
});

