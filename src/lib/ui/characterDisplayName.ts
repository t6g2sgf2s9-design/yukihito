import type { Field,Person } from '../../types';
import { characterDisplayNames,characterOriginalNames } from '../../config/characterDisplayNames';
import { label } from '../../config/questions';
const aliases=Object.fromEntries(Object.entries(characterOriginalNames).map(([id,name])=>[name,characterDisplayNames[Number(id)]]));
const characterFields=new Set<Field>(['bannerCharacter','gachaCharacters','star5Characters','bonusCharacters','rewardCharacters','stampCharacters','teamCharacter']);
export function displayCharacterName(person:Person):string{return characterDisplayNames[person.id]??person.name;}
export function displayOption(field:Field,value:string):string{
 return characterFields.has(field)?aliases[value.replace(/\s/g,'')]??value:label[value]??value;
}
export function matchesOptionSearch(field:Field,value:string,query:string):boolean{
 const normalize=(text:string)=>text.normalize('NFKC').replace(/\s/g,'').toLowerCase();
 return [value,displayOption(field,value)].some(text=>normalize(text).includes(normalize(query)));
}
