import type { EventData, Field } from '../types';
export const initialQuestions: Field[] = ['bannerBandName', 'eventScope', 'year', 'half'];
export interface QuestionDefinition {
 field: Field; text: string; category: string; answerabilityWeight: number;
 reliabilityWeight: number; values?: (event: EventData) => string[]; hint?: string;
}
const define=(field:Field,text:string,category:string,answerabilityWeight:number,reliabilityWeight:number,hint?:string):QuestionDefinition=>({field,text,category,answerabilityWeight,reliabilityWeight,hint});
// Heuristic selection weights, not measured recall probabilities.
// Add a tag question with a values getter here; no engine changes required.
export const questionDefinitions: QuestionDefinition[] = [
 define('bannerBandName','バナーキャラの所属バンドは？','banner',1,.85,'バナー未確認の箱候補では、ボーナス対象の所属を使用。'),
 define('eventScope','イベントは箱イベ？混合イベ？','scope',1,.8,'ボーナス対象の所属からの暫定分類を含みます。'),
 define('year','何年頃のイベント？','time',.9,.8),
 define('half','上半期？下半期？','time',.85,.7),
 define('bannerCharacter','バナーキャラは誰？','banner',1,.95),
 define('eventAttribute','イベントタイプは？','attribute',.9,.9),
 define('eventFormat','イベント形式は？','format',.8,.9),
 define('gachaCharacters','ガチャに登場したキャラは？','gacha',.65,.8),
 define('star5Characters','ガチャの★5キャラは？','gacha',.65,.85),
 define('bonusCharacters','ボーナス対象のメンバーを覚えてる？','bonus',.6,.7),
 define('rewardCharacters','報酬キャラは？','reward',.65,.85),
 define('eventSongs','イベント楽曲は？','music',.65,.85),
 define('eventSongBands','イベント楽曲のバンドは？','music',.65,.85),
 define('stampCharacters','ボイススタンプのキャラは？','stamp',.4,.7),
 define('star5Era','★5が実装されていた時代？','era',.75,.85),
 define('seasonTags','季節イベントだった？','theme',.8,.75),
 define('collaborationTag','コラボイベントだった？','collaboration',.9,.9),
 define('limited','関連ガチャは限定だった？','gacha',.65,.8),
 define('gachaAttributes','ガチャカードの属性は？','gacha',.6,.75),
 define('rewardAttributes','報酬カードの属性は？','reward',.6,.75),
 // Team answers are weak bonus-based hints, not records of actual player teams.
 define('teamAttribute','使っていた編成の属性は？','attribute',.45,.45,'イベントのボーナス属性を手がかりにします。実際の編成と一致するとは限らないヨ。'),
 define('teamBand','使っていた編成のバンドは？','bonus',.45,.4,'ボーナス対象の所属から探す手がかりです。実際の編成を記録したデータではありません。'),
 define('teamCharacter','編成に入れていたキャラは？','bonus',.4,.35,'ボーナス対象キャラとの一致を弱い手がかりとして扱うヨ。'),
];
export const questionText = Object.fromEntries(questionDefinitions.map(q=>[q.field,q.text])) as Record<Field,string>;
export const definitionFor=(field:Field)=>questionDefinitions.find(q=>q.field===field);
export const label: Record<string,string> = {band:'箱イベ',mixed:'混合イベ',pure:'ピュア',cool:'クール',powerful:'パワフル',happy:'ハッピー',story:'通常形式',challenge:'チャレンジライブ',versus:'対バンライブ',live_try:'ライブトライ！',mission_live:'ミッションライブ',medley:'メドレーライブ',festival:'ライブフェスティバル',first:'1〜6月',second:'7〜12月',yes:'はい',no:'いいえ',limited:'限定あり',permanent:'恒常のみ'};
