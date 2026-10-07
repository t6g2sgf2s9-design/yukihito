import { useEffect,useRef,useState } from 'react';
import { comments } from '../../config/comments';
import { pickQuestionPrompt } from './questionPrompt';
export function useQuestionPrompt(questionKey:string|undefined):string {
 const [prompt,setPrompt]=useState(comments.questionPrompts[0]);
 const lastKey=useRef<string|undefined>(undefined);
 const previous=useRef<string|undefined>(undefined);
 useEffect(()=>{
  if(questionKey===undefined){lastKey.current=undefined;return;}
  if(lastKey.current===questionKey)return;
  const next=pickQuestionPrompt(previous.current);
  previous.current=next;lastKey.current=questionKey;setPrompt(next);
 },[questionKey]);
 return prompt;
}
