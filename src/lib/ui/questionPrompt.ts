import { comments } from '../../config/comments';
export function pickQuestionPrompt(previous?:string,random:()=>number=Math.random):string {
 const choices=comments.questionPrompts.filter(prompt=>prompt!==previous);
 return choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];
}
