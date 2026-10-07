import type { EventData } from '../../types';
import { crowdingFallback } from '../../config/crowding';
import { comments } from '../../config/comments';
import { specialEventComments } from '../../config/specialEvents';
import { specialEventOverrides } from '../../config/specialEventOverrides';

export type CrowdingLevel = 'crowded' | 'sparse';
export interface DataCrowdingDecision { level: CrowdingLevel; evidence: string[] }
export type DataCrowdingClassifier = (event: EventData) => DataCrowdingDecision | undefined;
export interface CrowdingClassification {
 level: CrowdingLevel | 'unknown' | 'unclassified';
 classificationSource: 'special' | 'data' | 'fallback' | 'unknown';
 messages: string[];
 evidence: string[];
}

// No validated comparison model exists yet. A final T10 point value alone
// does not establish density. Replace this adapter when comparative T1–T10
// analysis is available; it must return undefined when evidence is insufficient.
export const classifyFromData: DataCrowdingClassifier = () => undefined;

export function classifyCrowding(event: EventData, dataClassifier: DataCrowdingClassifier = classifyFromData): CrowdingClassification {
 const override=specialEventOverrides[event.eventId];
 if(override)return {level:'unclassified',classificationSource:'special',messages:[...override.commentLines],evidence:[`specialEventOverride:${event.eventId}`]};
 const special=specialEventComments[event.eventId];
 if (special) {
  return { level: special.level??'unclassified', classificationSource: 'special', messages: [...special.lines], evidence: [`specialEventId:${event.eventId}`] };
 }
 const decision = dataClassifier(event);
 if (decision && (decision.level === 'crowded' || decision.level === 'sparse') && decision.evidence.some(source=>source.trim().length>0)) {
  return { level: decision.level, classificationSource: 'data', messages: [comments[decision.level]], evidence: decision.evidence };
 }
 const banner = event.bannerCharacter;
 if (banner && Number.isSafeInteger(banner.id) && banner.id > 0) {
  const level = crowdingFallback.crowdedBandIds.has(banner.bandId) || crowdingFallback.crowdedCharacterIds.has(banner.id) ? 'crowded' : 'sparse';
  return { level, classificationSource: 'fallback', messages: [comments[level]], evidence: [`bannerCharacterId:${banner.id}`, `bannerBandId:${banner.bandId}`] };
 }
 return { level: 'sparse', classificationSource: 'fallback', messages: [comments.sparse], evidence: ['default:sparse-no-banner'] };
}
