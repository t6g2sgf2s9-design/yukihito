import type { EventData } from '../../types';
import { specialEventOverrides } from '../../config/specialEventOverrides';
export function resolveResultRank(event:EventData){
 const override=specialEventOverrides[event.eventId];
 const rank=override?.resultRank??10;
 const candidate=override?.manualFinalRankPoints??(rank===10?event.top10FinalPoints:event.finalRankPoints?.[rank]);
 const points=candidate&&Number.isSafeInteger(candidate.points)&&candidate.points>=0?candidate:undefined;
 return {rank,label:rank===3?'🥉 3位':`🏆 日本版・${rank}位ボーダー`,points};
}
