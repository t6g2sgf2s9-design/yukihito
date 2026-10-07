import type { Answer, Candidate, Field, Question } from '../../types';
import { definitionFor, initialQuestions, questionDefinitions } from '../../config/questions';
import { searchTuning } from '../../config/search';
import { calculateInformationGain } from './calculateInformationGain';
import { updateMemoryProfile } from './updateMemoryProfile';
import { shortlist } from './scoreCandidates';
import { values } from './featureValues';
export function questionFor(field:Field,candidates:Candidate[],answers:Answer[]=[]):Question|undefined{
 if(answers.some(a=>a.field===field))return;
 // Do not rephrase an already asked feature with identical candidate data.
 if(answers.some(a=>candidates.every(c=>[...values(c.event,field)].sort().join('|')===[...values(c.event,a.field)].sort().join('|'))))return;
 const definition=definitionFor(field),info=calculateInformationGain(field,candidates);
 if(!definition||!info)return;
 const memory=updateMemoryProfile(answers)[definition.category];
 const answerability=definition.answerabilityWeight*(memory?.answerabilityMultiplier??1);
 const similar=answers.filter(a=>definitionFor(a.field)?.category===definition.category);
 const repetitionPenalty=Math.pow(.75,similar.length);
 const relevance=1+info.topDiscrimination*(candidates.length<=5?1.5:.5);
 const questionScore=info.informationGain*answerability*definition.reliabilityWeight*relevance*info.dataCoverage*repetitionPenalty;
 if(questionScore<searchTuning.minQuestionScore)return;
 return {field,text:definition.text,options:info.options,gain:questionScore,diagnostics:{informationGain:info.informationGain,answerability,reliability:definition.reliabilityWeight,relevance,dataCoverage:info.dataCoverage,repetitionPenalty,topDiscrimination:info.topDiscrimination,questionScore}};
}
export function evaluateQuestions(ranked:Candidate[],answers:Answer[]):Question[]{
 const candidates=shortlist(ranked);
 return questionDefinitions.map(d=>questionFor(d.field,candidates,answers)).filter((q):q is Question=>!!q).sort((a,b)=>b.gain-a.gain);
}
export function nextQuestion(ranked:Candidate[],answers:Answer[]):Question|undefined{
 const questions=evaluateQuestions(ranked,answers);
 for(const field of initialQuestions){const q=questions.find(q=>q.field===field);if(q)return q;}
 return questions[0];
}
