import type { Candidate, Field } from '../../types';
import { values } from './featureValues';
export function calculateInformationGain(field:Field,candidates:Candidate[]){
 const known=candidates.filter(c=>values(c.event,field).length);
 const options=[...new Set(known.flatMap(c=>values(c.event,field)))].sort((a,b)=>a.localeCompare(b,'ja',{numeric:true}));
 const signatures=new Set(known.map(c=>[...values(c.event,field)].sort().join('|')));
 if(options.length<2||signatures.size<2)return;
 const total=candidates.reduce((sum,c)=>sum+c.probability,0);
 const mass=known.reduce((sum,c)=>sum+c.probability,0);
 if(!total||!mass)return;
 const entropy=options.reduce((sum,value)=>{
  const p=known.reduce((n,c)=>{const v=values(c.event,field);return n+(v.includes(value)?c.probability/v.length:0);},0)/mass;
  return sum-(p>0?p*Math.log2(p):0);
 },0);
 // Mutual information H(answer) - H(answer | event). Multi-valued fields
 // are not valuable merely because each event supplies many names.
 const within=known.reduce((sum,c)=>sum+c.probability/mass*Math.log2(values(c.event,field).length),0);
 const dataCoverage=Math.sqrt((mass/total)*(known.length/candidates.length));
 const first=values(candidates[0].event,field),second=candidates[1]?values(candidates[1].event,field):[];
 const union=new Set([...first,...second]);
 const overlap=first.filter(v=>second.includes(v)).length;
 const topDiscrimination=first.length&&second.length?1-overlap/union.size:0;
 return {options,informationGain:Math.max(0,entropy-within),dataCoverage,topDiscrimination};
}
