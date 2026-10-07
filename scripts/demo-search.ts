import dataset from '../data/generated/events.json';
import type { Answer,EventData } from '../src/types';
import { decideNextStep,rankEvents,values,predictionDiagnostics } from '../src/lib/search/engine';
import { label } from '../src/config/questions';
const events=dataset.events as EventData[];
const demos=[];
for(const id of [259,280,342]){
 const target=events.find(e=>e.eventId===id)!;
 const answers:Answer[]=[],excluded:number[]=[],trace=[];
 for(let i=0;i<80;i++){
  const ranked=rankEvents(events,answers,excluded),step=decideNextStep(ranked,answers,excluded.length);
  if(step.type==='question'){
   const q=step.question,value=values(target,q.field).find(v=>q.options.includes(v))??null;
   trace.push({question:q.text,field:q.field,answer:value===null?'わからない':label[value]??value});
   answers.push({field:q.field,value,confidence:q.field==='year'?'approximate':'certain'});
  }else if(step.type==='guess'){
   const correct=step.candidate.event.eventId===id;
   trace.push({guess:step.candidate.event.eventName,correct});
   if(correct)break;excluded.push(step.candidate.event.eventId);
  }else {trace.push({end:step.type});break;}
 }
 const d=predictionDiagnostics(rankEvents(events,answers,excluded),answers);
 demos.push({eventId:id,eventName:target.eventName,trace,questions:answers.length,rejected:excluded.length,topConfidence:d.topConfidence,scoreGap:d.scoreGap});
}
// Truthful-answer simulations from real records, not measured human recall.
console.log(JSON.stringify(demos,null,2));
