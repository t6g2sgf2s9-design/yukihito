import type { Answer, Candidate, EventData } from '../../types';
import { searchTuning } from '../../config/search';
import { definitionFor } from '../../config/questions';
import { values } from './featureValues';
export function scoreEvent(event:EventData,answers:Answer[]):number {
 return answers.reduce((score,answer)=>{
  if(answer.value===null)return score;
  const options=values(event,answer.field);if(!options.length)return score;
  if(answer.field==='year'&&answer.confidence==='approximate'){
   const distance=Math.abs(event.year-Number(answer.value));
   return score+(distance===0?3:distance===1?1.5:distance===2?0:-1.5);
  }
  // Preserve existing scores; personal-team proxies are weaker evidence.
  const proxyWeight=answer.field.startsWith('team')?(definitionFor(answer.field)?.reliabilityWeight??.4):1;
  const strength=(answer.confidence==='approximate'?.55:1)*proxyWeight;
  return score+strength*(options.includes(answer.value)?searchTuning.match:searchTuning.mismatch);
 },0);
}
export function rankEvents(events:EventData[],answers:Answer[],excluded:number[]=[]):Candidate[]{
 const omitted=new Set(excluded);
 const ranked=events.filter(e=>!omitted.has(e.eventId)).map(event=>({event,score:scoreEvent(event,answers),probability:0})).sort((a,b)=>b.score-a.score||b.event.startAt-a.event.startAt);
 if(!ranked.length)return [];
 const weights=ranked.map(c=>Math.exp((c.score-ranked[0].score)/searchTuning.temperature));
 const total=weights.reduce((a,b)=>a+b,0);
 return ranked.map((c,i)=>({...c,probability:weights[i]/total}));
}
export const shortlist=(ranked:Candidate[])=>ranked.filter(c=>c.score>=(ranked[0]?.score??0)-searchTuning.shortlistGap);
