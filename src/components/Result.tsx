import type { EventData } from '../types';
import { label } from '../config/questions';
import { classifyCrowding } from '../lib/data/crowding';
import { displayCharacterName } from '../lib/ui/characterDisplayName';
import { resolveResultRank } from '../lib/data/resultRank';
import { YukinatorPortrait } from './yukinator/YukinatorPortrait';
export const dateText=(timestamp:number)=>new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(timestamp);
export function Result({event,onReject,onReset}:{event:EventData;onReject:()=>void;onReset:()=>void}) {
 const list=(names:string[])=>[...new Set(names)].join('、')||'未取得';
 const classification=classifyCrowding(event);
 const ranking=resolveResultRank(event);
 return <section className="result" aria-labelledby="result-title"><p className="eyebrow">見つかったよ！ / EVENT #{event.eventId}</p><h2 id="result-title">{event.eventName}</h2>
 {ranking.rank===3&&<div className="result-rank-portrait"><YukinatorPortrait variant="result"/></div>}
 {classification.messages.length>0&&(<div className="special" aria-label="ゆきネーターのイベントコメント">{classification.messages.map(c=><p key={c}>{c}</p>)}</div>)}
 <div className="border"><p>{ranking.label}</p><strong>{ranking.points?ranking.points.points.toLocaleString('ja-JP'):'未取得'}{ranking.points&&<small> pt</small>}</strong><span>{ranking.points?'Bestdori 最終ランキング記録':'最終記録を確認できませんでした'}</span>{ranking.points&&<a href={ranking.points.source} target="_blank" rel="noreferrer">取得元を見る ↗</a>}</div>

 <p className="period">{dateText(event.startAt)}<br/>〜 {dateText(event.endAt)}（日本時間）</p>
 <dl><dt>バナーキャラ</dt><dd>{event.bannerCharacter?displayCharacterName(event.bannerCharacter):'未確認'}</dd><dt>バンド</dt><dd>{event.bannerBandName??'未確認'}{!event.bannerCharacter&&event.bannerBandName&&<small>（ボーナス対象の所属）</small>}</dd><dt>箱 / 混合</dt><dd>{label[event.eventScope??'']??'未確認'}<small>{event.scopeBasis}</small></dd><dt>タイプ / 形式</dt><dd>{label[event.eventAttribute??'']??'未取得'} / {label[event.eventFormat]??event.eventFormat}</dd><dt>関連ガチャ</dt><dd>{event.gachas.length?event.gachas.map(g=><p key={g.id}>{g.name}</p>):'未確認'}{event.gachas.length>0&&<small>{event.gachaBasis}</small>}</dd><dt>ガチャ登場キャラ</dt><dd>{list(event.gachas.flatMap(g=>g.cards.map(c=>`${displayCharacterName(c.character)}（★${c.rarity}）`)))}</dd><dt>報酬キャラ</dt><dd>{list(event.rewardCards.map(c=>`${displayCharacterName(c.character)}（★${c.rarity}）`))}</dd><dt>イベント楽曲</dt><dd>{list(event.eventSongs)}</dd><dt>ボイススタンプ</dt><dd>{list(event.stampCharacters.map(displayCharacterName))}</dd></dl>
 <details><summary>データの根拠と補足</summary>{event.notes.map(n=><p key={n}>{n}</p>)}{event.sources.map((url,i)=><p key={url}><a href={url} target="_blank" rel="noreferrer">{i===0?'Bestdoriイベントデータ':'照合資料'} ↗</a></p>)}<p>Bestdoriは非公式サービスです。未確認項目は推測で埋めていません。全イベントの公式照合は未実施です。</p></details>
 <button className="primary" onClick={onReset}>もう一度あそぶ ❄️</button><button className="secondary" onClick={onReject}>これじゃない</button></section>;
}



