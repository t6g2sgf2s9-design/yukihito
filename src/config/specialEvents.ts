import { comments } from './comments';
// IDs verified against the existing 343-event dataset and raw Bestdori master.
export interface SpecialEventComment { lines: readonly string[]; level?: 'crowded' | 'sparse' }
export const specialEventComments: Readonly<Record<number,SpecialEventComment>> = {
 298: {lines:comments.special,level:'crowded'}, // Baby steps!
 280: {lines:comments.special,level:'crowded'}, // Rockin' Our Trip!
 171: {lines:comments.special,level:'crowded'}, // 「そんな人じゃないんです！」
 170: {lines:comments.special,level:'crowded'}, // 聖夜に集うSnow Rose
 132: {lines:comments.special,level:'crowded'}, // 新たな旅立ちのアインザッツ
 342: {lines:comments.special,level:'crowded'}, // 未来想送曲
 293: {lines:['1位と友達なんだよね🤭']}, // Secret 1Day Andante
 318: {lines:['1位と友達なんだよね🤭']}, // あなたを照らすオーバード
 275: {lines:['りんちゃんは孤独に弱いね🤭']}, // 探検！体験！ワクワクアクアリウム！
 259: {lines:['10取るには美味しいイベントだよね！','こんなイベント走りたかったなー🤭']},
 271: {lines:['海外から参加してた猛者がいるらしいよ🤭']}, // マシロ・イン・ワンダーランド
};
export const specialEventIds=new Set(Object.keys(specialEventComments).map(Number));
