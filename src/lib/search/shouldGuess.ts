import type { Answer, Candidate } from '../../types';
import { searchTuning } from '../../config/search';
import { evaluateQuestions } from './selectNextQuestion';
import { shortlist } from './scoreCandidates';
export function predictionDiagnostics(ranked:Candidate[],answers:Answer[]){
 const questions=evaluateQuestions(ranked,answers);
 const topConfidence=ranked[0]?.probability??0;
 const scoreGap=ranked.length>1?ranked[0].score-ranked[1].score:ranked.length?Infinity:0;
 const strongestTopQuestion=questions.filter(q=>q.diagnostics.topDiscrimination>=.5).reduce((m,q)=>Math.max(m,q.gain),0);
 return {topConfidence,scoreGap,maxQuestionScore:questions[0]?.gain??0,strongestTopQuestion,remaining:shortlist(ranked).length,evidence:answers.filter(a=>a.value!==null).length,questions};
}
export function shouldPredict(ranked:Candidate[],answers:Answer[]):boolean{
 if(!ranked.length)return false;
 const d=predictionDiagnostics(ranked,answers);
 if(ranked.length===1||!d.questions.length)return true;
 if(d.evidence>=2&&d.topConfidence>=searchTuning.strongPredictionConfidence&&d.scoreGap>=searchTuning.strongPredictionGap)return true;
 if(d.strongestTopQuestion>=searchTuning.strongQuestionScore)return false;
 return d.evidence>=4&&d.topConfidence>=searchTuning.predictionConfidence&&d.scoreGap>=searchTuning.predictionGap;
}
