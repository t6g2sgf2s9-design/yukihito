import type { EventData, Field } from '../../types';
import { definitionFor } from '../../config/questions';
export function values(event: EventData, field: Field): string[] {
 const custom=definitionFor(field)?.values;
 if(custom) return [...new Set(custom(event).filter(Boolean))];
 if(field.startsWith('tag:')) return event.memoryTags?.[field.slice(4)]??[];
 switch(field) {
  case 'bannerCharacter': return event.bannerCharacter?[event.bannerCharacter.name]:[];
  case 'gachaCharacters': return [...new Set(event.gachas.flatMap(g=>g.cards.map(c=>c.character.name)))];
  case 'star5Characters': return [...new Set(event.gachas.flatMap(g=>g.cards.filter(c=>c.rarity===5).map(c=>c.character.name)))];
  case 'bonusCharacters': case 'teamCharacter': return [...new Set(event.bonusCharacters.map(c=>c.name))];
  case 'rewardCharacters': return [...new Set(event.rewardCards.map(c=>c.character.name))];
  case 'stampCharacters': return [...new Set(event.stampCharacters.map(c=>c.name))];
  case 'gachaAttributes': return [...new Set(event.gachas.flatMap(g=>g.cards.flatMap(c=>c.attribute?[c.attribute]:[])))];
  case 'rewardAttributes': return [...new Set(event.rewardCards.flatMap(c=>c.attribute?[c.attribute]:[]))];
  case 'teamAttribute': return event.eventAttribute?[event.eventAttribute]:[];
  case 'teamBand': return [...new Set(event.bonusCharacters.map(c=>c.bandName).filter(n=>n!=='不明'))];
  case 'year': return [String(event.year)];
  case 'star5Era': return event.star5Era===undefined?[]:[event.star5Era?'yes':'no'];
  default: { const value=(event as unknown as Record<string,unknown>)[field];return Array.isArray(value)?value.filter((v):v is string=>typeof v==='string'):typeof value==='string'?[value]:[]; }
 }
}
