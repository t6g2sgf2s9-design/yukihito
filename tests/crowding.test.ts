import { describe, expect, it, vi } from 'vitest';
import dataset from '../data/generated/events.json';
import characters from '../data/raw/characters.json';
import bands from '../data/raw/bands.json';
import type { EventData, Person } from '../src/types';
import { classifyCrowding } from '../src/lib/data/crowding';
import { comments } from '../src/config/comments';
// Keep ordinary classification fixtures outside the newly special event 259.
const target={...dataset.events.find(e=>e.eventId===259)!,eventId:9000} as EventData;
const character=(id:number,bandId:number):Person=>({id,bandId,name:'名前に依存しない',bandName:'名前に依存しない'});
const event=(bannerCharacter?:Person):EventData=>({...target,bannerCharacter});
describe('過密コメントの優先順位',()=>{
 it('特殊イベントはデータ判定より優先し、通常判定を呼ばない',()=>{
  const classifier=vi.fn(()=>({level:'sparse' as const,evidence:['verified-comparison']}));
  const result=classifyCrowding({...event(character(1,1)),eventId:298},classifier);
  expect(result.classificationSource).toBe('special');expect(result.messages).toEqual(comments.special);expect(classifier).not.toHaveBeenCalled();
 });
 it.each(['crowded','sparse'] as const)('十分なデータ判定 %s はバナー基準より優先する',level=>{
  const result=classifyCrowding(event(character(level==='sparse'?1:26,1)),()=>({level,evidence:['verified-comparison']}));
  expect(result.classificationSource).toBe('data');expect(result.level).toBe(level);expect(result.messages).toEqual([comments[level]]);
 });
 it.each([[36,45],[40,45],[1,1],[21,5]])('人物ID %i バンドID %i はデータ不足なら過密', (id,bandId)=>{
  const result=classifyCrowding(event(character(id,bandId)));
  expect(result.classificationSource).toBe('fallback');expect(result.messages).toEqual(['過密じゃん😱']);
 });
 it('その他の既知バナー人物は過疎',()=>{
  const result=classifyCrowding(target);expect(result.classificationSource).toBe('fallback');expect(result.level).toBe('sparse');expect(result.messages).toEqual(['過疎イベじゃーん！走ればよかった🤭']);
 });
 it('バナー人物不明は所属文字列やボーナス対象から推測しない',()=>{
  const result=classifyCrowding({...event(),bannerBandName:'MyGO!!!!!'});
  expect(result.classificationSource).toBe('fallback');expect(result.messages).toEqual(['過疎イベじゃーん！走ればよかった🤭']);expect(result.evidence).toContain('default:sparse-no-banner');
 });
 it('10位ボーダーがあっても比較判定が不能ならバナー基準へ進む',()=>{
  expect(target.top10FinalPoints).toBeDefined();expect(classifyCrowding(target).classificationSource).toBe('fallback');
 });
 it('根拠のない通常判定を採用しない',()=>{
  expect(classifyCrowding(target,()=>({level:'crowded',evidence:[]})).classificationSource).toBe('fallback');
 });
 it('特殊イベントはバナーもボーダーも欠けていても特殊コメント',()=>{
  expect(classifyCrowding({...event(),eventId:342,top10FinalPoints:undefined}).messages).toEqual(comments.special);
 });
 it('データで判定可能ならバナー不明でも通常結果を採用する',()=>{
  expect(classifyCrowding(event(),()=>({level:'sparse',evidence:['verified-comparison']})).classificationSource).toBe('data');
 });
 it('設定IDが保存済みマスターと一致する',()=>{
  expect(characters['1'].characterName[0]).toBe('戸山 香澄');expect(characters['21'].characterName[0]).toBe('湊 友希那');expect(bands['45'].bandName[0]).toBe('MyGO!!!!!');
 });
});

