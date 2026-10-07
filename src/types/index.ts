export interface Person { id: number; name: string; bandId: number; bandName: string }
export interface Card { id: number; character: Person; rarity: number; name: string; type: string; attribute?: string }
export interface Gacha { id: number; name: string; type: string; cards: Card[] }
export interface Border { points: number; observedAt: number; source: string }
export interface EventData {
  eventId: number; eventName: string; startAt: number; endAt: number;
  year: number; half: string; bannerCharacter?: Person; bannerBandName?: string;
  eventScope?: 'band' | 'mixed'; scopeBasis?: string; eventAttribute?: string;
  eventFormat: string; bonusCharacters: Person[]; rewardCards: Card[];
  gachas: Gacha[]; gachaBasis?: string; eventSongs: string[]; eventSongBands?: string[]; stampCharacters: Person[];
  memoryTags?: Record<string, string[]>;
  star5Era?: boolean; seasonTags: string[]; collaborationTag?: string; limited?: string;
  top10FinalPoints?: Border; sources: string[]; notes: string[];
}
export type Field = 'bannerBandName' | 'eventScope' | 'year' | 'half' | 'bannerCharacter' | 'eventAttribute' | 'eventFormat' | 'gachaCharacters' | 'star5Characters' | 'bonusCharacters' | 'rewardCharacters' | 'eventSongs' | 'eventSongBands' | 'stampCharacters' | 'star5Era' | 'seasonTags' | 'collaborationTag' | 'limited' | 'teamAttribute' | 'teamBand' | 'teamCharacter' | 'gachaAttributes' | 'rewardAttributes' | `tag:${string}`;
export interface Answer { field: Field; value: string | null; confidence: 'certain' | 'approximate' }
export interface QuestionDiagnostics { informationGain: number; answerability: number; reliability: number; relevance: number; dataCoverage: number; repetitionPenalty: number; topDiscrimination: number; questionScore: number }
export interface Question { field: Field; text: string; gain: number; options: string[]; diagnostics: QuestionDiagnostics }
export interface Candidate { event: EventData; score: number; probability: number }
