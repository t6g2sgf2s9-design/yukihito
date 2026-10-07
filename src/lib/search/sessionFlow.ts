import type { Answer, Candidate, Question } from '../../types';
import { searchTuning } from '../../config/search';
import { nextQuestion } from './selectNextQuestion';
import { shouldPredict } from './shouldGuess';
export type SearchStep={type:'question';question:Question}|{type:'guess';candidate:Candidate}|{type:'rescue';reason:'exhausted-unknowns'|'exhausted-ties'}|{type:'empty'};
export function decideNextStep(ranked:Candidate[],answers:Answer[],rejections=0):SearchStep{
 if(!ranked.length)return {type:'empty'};
 const question=nextQuestion(ranked,answers);
 if(question){return shouldPredict(ranked,answers)?{type:'guess',candidate:ranked[0]}:{type:'question',question};}
 // Exhausting questions always yields at least one single-event guess first.
 if(rejections>=searchTuning.rescueRejections){
  const mostlyUnknown=answers.length>0&&answers.filter(a=>a.value===null).length/answers.length>=.8;
  const tied=ranked.filter(c=>Math.abs(c.score-ranked[0].score)<1e-9).length;
  if(mostlyUnknown)return {type:'rescue',reason:'exhausted-unknowns'};
  if(tied>=searchTuning.rescueTieCount)return {type:'rescue',reason:'exhausted-ties'};
 }
 return {type:'guess',candidate:ranked[0]};
}
export function tooManyUnknowns(answers:Answer[]):boolean{return answers.slice(-searchTuning.unknownLimit).length===searchTuning.unknownLimit&&answers.slice(-searchTuning.unknownLimit).every(a=>a.value===null);}
