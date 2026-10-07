import type { Border } from '../types';
export interface SpecialEventOverride {
 resultRank: number;
 commentLines: readonly string[];
 // Optional verified manual replacement; never substitute T10 for this rank.
 manualFinalRankPoints?: Border;
}
export const specialEventOverrides: Readonly<Record<number,SpecialEventOverride>> = {
 132: {
  resultRank:3,
  commentLines:['このイベントは私、ゆきんこが3位を取ったイベントです🤭'],
 },
};
