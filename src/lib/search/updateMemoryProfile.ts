import type { Answer } from '../../types';
import { definitionFor } from '../../config/questions';
export interface MemoryCategory { known: number; certain: number; unknown: number; answerabilityMultiplier: number }
export type UserMemoryProfile = Record<string,MemoryCategory>;
export function updateMemoryProfile(answers:Answer[]):UserMemoryProfile{
 const profile:UserMemoryProfile={};
 for(const answer of answers){
  const group=definitionFor(answer.field)?.category??answer.field;
  const memory=profile[group]??{known:0,certain:0,unknown:0,answerabilityMultiplier:1};
  if(answer.value===null){memory.unknown++;memory.answerabilityMultiplier*=.3;}
  else {memory.known++;if(answer.confidence==='certain')memory.certain++;memory.answerabilityMultiplier*=answer.confidence==='certain'?1.6:1.2;}
  memory.answerabilityMultiplier=Math.max(.08,Math.min(2,memory.answerabilityMultiplier));profile[group]=memory;
 }
 return profile;
}
