import { useEffect, useMemo, useRef, useState } from 'react';
import dataset from '../data/generated/events.json';
import type { Answer, EventData } from './types';
import { rankEvents, nextQuestion, shortlist, decideNextStep, predictionDiagnostics, updateMemoryProfile } from './lib/search/engine';
import { comments } from './config/comments';
import { label, definitionFor, initialQuestions } from './config/questions';
import { Character } from './components/Character';
import { Result, dateText } from './components/Result';
import { useQuestionPrompt } from './lib/ui/useQuestionPrompt';
import { displayOption,matchesOptionSearch } from './lib/ui/characterDisplayName';
import { specialEventOverrides } from './config/specialEventOverrides';
const events=dataset.events as EventData[];
type Screen='start'|'question'|'guess'|'result'|'browse'|'empty';
export default function App() {
 const [screen,setScreen]=useState<Screen>('start');
 const [answers,setAnswers]=useState<Answer[]>([]);
 const [excluded,setExcluded]=useState<number[]>([]);
 const [chosen,setChosen]=useState<EventData>();
 const [confidence,setConfidence]=useState<Answer['confidence']>('approximate');
 const [filter,setFilter]=useState('');
 const [missed,setMissed]=useState(false);
 const titleRef=useRef<HTMLHeadingElement>(null);
 const ranked=useMemo(()=>rankEvents(events,answers,excluded),[answers,excluded]);
 const active=shortlist(ranked), question=useMemo(()=>nextQuestion(ranked,answers),[ranked,answers]);
 const questionHint=question&&definitionFor(question.field)?.hint;
 const questionPrompt=useQuestionPrompt(screen==='question'&&question?`${question.field}:${answers.length}:${excluded.length}`:undefined);
 useEffect(()=>{
  if(import.meta.env.DEV&&screen!=='start'){
   const debug=predictionDiagnostics(ranked,answers);
   console.debug('[yukinator] search',{screen,selectedQuestion:screen==='question'?question?.field:undefined,selectedQuestionReason:screen==='question'?(question&&initialQuestions.includes(question.field)?'initial-classification':'highest-question-score'):undefined,topCandidates:ranked.slice(0,3).map(c=>({eventId:c.event.eventId,confidence:c.probability,score:c.score})),scoreGap:debug.scoreGap,maxQuestionScore:debug.maxQuestionScore,memoryProfile:updateMemoryProfile(answers)});
   console.table(debug.questions.map(q=>({field:q.field,...q.diagnostics})));
  }
 },[ranked,answers,question,screen]);
 useEffect(()=>{if(screen!=='start'){titleRef.current?.focus();window.scrollTo({top:0,behavior:'smooth'});}},[screen,answers.length]);
 const reset=()=>{setAnswers([]);setExcluded([]);setChosen(undefined);setFilter('');setMissed(false);setScreen('start');};
 const advance=(nextAnswers:Answer[],nextExcluded:number[])=>{
  const step=decideNextStep(rankEvents(events,nextAnswers,nextExcluded),nextAnswers,nextExcluded.length);
  setChosen(step.type==='guess'?step.candidate.event:undefined);
  setScreen(step.type==='rescue'?'browse':step.type);
 };
 const answer=(value:string|null)=>{
  if(!question)return;
  const next=[...answers,{field:question.field,value,confidence}];setAnswers(next);setFilter('');setMissed(false);
  advance(next,excluded);
 };
 const reject=()=>{
  if(!chosen)return;
  const next=[...excluded,chosen.eventId];setExcluded(next);setChosen(undefined);setMissed(true);setFilter('');
  advance(answers,next);
 };
 const guess=(event:EventData)=>{setChosen(event);setScreen('guess');};
 const message=screen==='start'?comments.start:screen==='guess'?(missed?`${comments.missed} ${comments.narrowed}`:comments.narrowed):screen==='result'&&chosen?comments.found(chosen.eventName):screen==='browse'||screen==='empty'?comments.unknown:questionPrompt;
 const options=question?.options.filter(o=>matchesOptionSearch(question.field,o,filter))??[];
 const matches=ranked.filter(c=>!filter||c.event.eventName.normalize('NFKC').toLowerCase().includes(filter.normalize('NFKC').toLowerCase()));
 return <div className="app"><header><a className="wordmark" href="/">バンドリ！<b>ゆきネーター！<span>❄️</span></b></a><span className="header-tag">きおくで当てる</span></header>
 <main>{!(screen==='result'&&chosen&&specialEventOverrides[chosen.eventId]?.resultRank===3)&&<Character message={message} variant={screen==='start'?'start':screen==='result'?'result':screen==='guess'?'guess':'question'}/>}
 {screen==='start'?<section className="welcome"><p className="eyebrow">あのイベント、なんだっけ？</p><h1>キミの思い出、<br/>当てちゃうヨ<span>🤭</span></h1><p className="intro">バンドも、時期も、うろ覚えでOK。<br/>ゆきネーターと、記憶をたどろう。</p><button className="primary start" onClick={()=>setScreen('question')}>思い出してみる <span>→</span></button><p className="hint">登録不要・日本版の過去イベント {events.length}件</p></section>:
 screen==='result'&&chosen?<Result event={chosen} onReject={reject} onReset={reset}/>:
 screen==='guess'&&chosen?<section className="guess"><p className="eyebrow">ゆきネーターの予想</p><h2 ref={titleRef} tabIndex={-1}>{comments.found(chosen.eventName)}</h2><p className="period">{dateText(chosen.startAt)} 開催</p><div className="guess-tags"><span>{chosen.bannerBandName??'バンド未確認'}</span><span>{label[chosen.eventAttribute??'']??'属性未取得'}</span></div><button className="primary" onClick={()=>setScreen('result')}>これだ！ 🎉</button><button className="secondary" onClick={reject}>これじゃない</button><p className="hint">一致度からの予想です。外れても続けられるヨ。</p></section>:
 screen==='question'&&question?<section className="question"><div className="question-meta"><span>QUESTION {String(answers.length+1).padStart(2,'0')}</span><span>有力候補 {active.length}件</span></div><h2 ref={titleRef} tabIndex={-1}>{question.text}</h2>{questionHint&&<p className="hint">{questionHint}</p>}
 <div className="confidence" aria-label="記憶の確かさ"><button aria-pressed={confidence==='approximate'} onClick={()=>setConfidence('approximate')}>だいたい{question.field==='year'?'この年':'覚えてる'}</button><button aria-pressed={confidence==='certain'} onClick={()=>setConfidence('certain')}>ほぼ確実</button></div>
 {question.options.length>12&&<input type="search" aria-label="選択肢を検索" placeholder="名前でさがす…" value={filter} onChange={e=>setFilter(e.target.value)}/>}
 <div className={`options ${question.field==='bannerBandName'?'bands':''}`}>{options.map(o=><button key={o} onClick={()=>answer(o)}>{displayOption(question.field,o)}<span aria-hidden="true">›</span></button>)}</div>{!options.length&&<p>見つからないヨ。別の言葉で探してみて。</p>}
 <div className="unknown-dock"><button className="unknown" onClick={()=>answer(null)}>わからない 🤔</button></div><div className="utility"><button disabled={!answers.length} onClick={()=>{const previous=answers.slice(0,-1);setAnswers(previous);advance(previous,excluded);setFilter('');}}>ひとつ戻る</button><button onClick={reset}>最初からあそぶ</button></div></section>:
 screen==='empty'?<section className="browse"><h2 ref={titleRef} tabIndex={-1}>候補を全部見送っちゃった🥲</h2><button className="primary" onClick={reset}>最初からあそぶ</button></section>:
 <section className="browse"><p className="eyebrow">記憶のかけらを探そう</p><h2 ref={titleRef} tabIndex={-1}>この中にあるかな？</h2><p className="intro">何度か予想したけど、見つからないネ。<br/>最後にタイトルで探してみよう。</p><input type="search" placeholder="イベント名の一部でさがす…" aria-label="イベント名を検索" value={filter} onChange={e=>setFilter(e.target.value)}/><div className="candidate-list">{matches.slice(0,filter?40:8).map(c=><button key={c.event.eventId} onClick={()=>guess(c.event)}><small>{c.event.year}年・{label[c.event.eventAttribute??'']??'属性未取得'}</small><span>{c.event.eventName}</span><b aria-hidden="true">↗</b></button>)}</div>{!matches.length&&<p>該当なし。短いタイトルの一部で試してみて。</p>}{answers.length>0&&<button className="secondary" onClick={()=>{const previous=answers.slice(0,-1);setAnswers(previous);advance(previous,excluded);setFilter('');setMissed(false);}}>回答をひとつ戻す</button>}<button className="secondary" onClick={reset}>最初からあそぶ</button></section>}
 </main><footer><span>思い出は、ちょっと曖昧なくらいで。</span><details><summary>このアプリについて</summary><p>ファンによる非公式アプリです。データ提供：<a href="https://bestdori.com" target="_blank" rel="noreferrer">Bestdori</a>。検索用データ更新：{new Date(dataset.generatedAt).toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo'})}。終了済み日本版イベントのみ。欠損情報は未確認・未取得と表示します。</p><p>T1〜T10の推定稼働分析は未実装です。</p></details></footer></div>;
}




