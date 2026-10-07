公開手順は [DEPLOY.md](DEPLOY.md) を参照してください。現在のVercel設定は同ファイルの表が基準です。

# バンドリ！ゆきネーター！❄️

曖昧な記憶から、日本版ガルパの終了済みイベントを探す非公式ファンアプリ。React / TypeScript / Viteの静的サイトです。公開後の一般利用者はURLを開くだけで遊べます。登録・Bestdoriログイン・環境変数は不要。閲覧時にBestdori APIへアクセスしません。

## ローカル起動・検証

プロジェクトルートは `C:\path\to\yukinator`。余計な親フォルダはありません。
開発者のみNode.js 24.xとnpmまたはpnpmを使用します。

```powershell
cd C:\path\to\yukinator
npm install
npm run dev
npm test
npm run build
npm run preview
```

pnpmを使う場合は `pnpm install --frozen-lockfile`、`pnpm run dev` 等。pnpm-lock.yamlを同梱しています。ビルド成果物は `dist/`。起動URLは端末に表示されます（標準は http://127.0.0.1:5173/）。開発サーバーはlocalhostのみ公開します。

この実装環境ではnpmコマンドがPATHになかったため、Codex同梱のpnpmを利用しました。ユーザーの開発環境に通常のNode.jsがある場合、上のnpmコマンドで利用できます。

## 構成とPhase

| 場所 | 役割 |
| --- | --- |
| src/App.tsx、src/components、src/style.css | スマホ優先の質問・予想・結果UI |
| src/lib/search | スコア、特徴抽出、情報利得、記憶プロファイル、質問選択、予想判断、セッション進行を分離。engine.tsは互換用再export |
| src/lib/bestdori/adapter.ts | 確認済みAPI、取得と最終ランキング検証 |
| src/lib/data/normalize.ts | 日本版を正規化、欠損処理、override適用 |
| src/config | 質問、コメント、特殊イベントID |
| src/types | アプリ専用型 |
| data/raw | 取得したマスター・ポイントのみのランキング記録 |
| data/generated/events.json | UIに同梱する正規化データ |
| data/overrides/events.json | 手動修正と根拠 |
| scripts | 取得、生成、分析の未接続案内 |
| tests | 実データによる検索と欠損データの保護テスト |
| public/yukinator/character.png | 添付画像の無加工コピー |
| data/specification.txt | ユーザー提供仕様書 |

Phase 1で実レスポンスと公式発表を調査。Phase 2でraw取得・変換、Phase 3で検索とテスト、Phase 4で質問UI、Phase 5で結果・ボーダーを実装。Phase 6のT1〜T10高度分析は保留。Phase 7はVercel用設定・ビルド・公開手順まで用意しています。公開済みURLの発行には所有者のVercel認証が必要です。

## データ調査（2026-10-07）

これはBestdoriの公式なAPI契約ではなく、現行レスポンスを直接確認した記録です。Bestdoriはガルパ公式ではありません。ローカライズ配列のindex 0（日本版）を使用し、日時はミリ秒の数値文字列から変換します。終了済みイベントのみ採用。表示と年・半期はAsia/Tokyo基準。

| 情報 | 確認したAPIとフィールド | 採用・制限 |
| --- | --- | --- |
| イベント | https://bestdori.com/api/events/all.5.json : eventName, startAt, endAt, eventType | 343件の終了済み日本版イベント |
| タイプ・ボーナス | attributes[].attribute, characters[].characterId, members[].situationId | 単一属性だけ採用。ボーナス対象≠ストーリー登場人物 |
| キャラ | https://bestdori.com/api/characters/all.2.json : characterName, bandId | 名前の空白を除去 |
| バンド | https://bestdori.com/api/bands/all.1.json : bandName | ボーナス対象から得られるバンドを維持。現在の扱いで除外しない |
| カード・報酬 | https://bestdori.com/api/cards/all.5.json : characterId, rarity, prefix, type, releasedAt ; イベントのrewardCards | 報酬IDと結合。★5時代は日本版★5カードの最初の公開時刻で判定 |
| ガチャ | https://bestdori.com/api/gacha/all.5.json : gachaName, publishedAt, type, newCards | 明示的overrideを優先。それ以外は開始時刻とボーナスカードの一致による「関連候補」。時刻の重なりだけで結合しない |
| 楽曲マスター | https://bestdori.com/api/songs/all.7.json : musicTitle, bandId, publishedAt | rawを保存。イベントへの確定した関連フィールドは未確認。公開日の一致でイベント楽曲と断定しない |
| スタンプ | https://bestdori.com/api/stamps/all.2.json : imageName | rawを保存。声・人物・イベントの対応は未確認。画像名から推測しない |
| 最終T10 | https://bestdori.com/api/eventtop/data?server=0&event=259&mid=0&latest=1 : points[].time, points[].value | 終了後の同一時刻の10件を確認し、最小値を10位として採用。221件取得、122件未取得 |
| T10時系列 | https://bestdori.com/api/tracker/data?server=0&event=259&tier=10 | 実レスポンスは REQUEST_INVALID。人物別T1〜T10時系列の仕様は未確認・adapter未接続 |
| バナー人物 | イベントマスターに明示フィールドなし | 推測しない。259は提供仕様のましろ指定をoverrideに保存。画像との独立照合は未実施 |
| 箱 / 混合 | 明示フィールドなし | 5人のボーナス対象が同じバンドなら箱、複数バンドなら混合の暫定分類。結果に根拠表示。override可 |
| 季節・コラボ | 確定した構造情報なし | overrideのみ。タイトルの語句から分類しない |

実際のeventTypeは story / challenge / versus / live_try / mission_live / medley / festival を観測。日本語表示は `src/config/questions.ts` で管理。候補に存在する形式のみ質問に出ます。

### 公式との照合

[ブシロード公式・2024年5月17日発表](https://bushiroad.com/media/f56374ed42e213e6) でeventId 259のイベント名、2024/5/21 15時開始、ガチャ名「輝く道へのアルディートガチャ」、ガチャ人物と報酬人物を照合しました。BestdoriではガチャID 1328、属性pure、形式mission_live、報酬カード1990/1989。終了時刻はBestdori由来で公式全件照合は未実施です。

対象イベントの10位最終記録は **53,734,475 pt**。観測時刻も保存し、結果から取得元を開けます。Bestdoriで古いイベントの最終ランキングが空のことがあります。その場合は「未取得」と表示し、0点や架空の数値を作りません。ユーザー名・紹介文は保存しません。

特殊コメントは確認済みeventIdで11件管理：298、280、171、170、132、342の既存6件に、293 Secret 1Day Andante、318 あなたを照らすオーバード、275 探検！体験！ワクワクアクアリウム！、259 月の森に響く未来へのアルス・ノヴァ、271 マシロ・イン・ワンダーランドを追加。設定はsrc/config/specialEvents.tsのeventId→{ lines: string[], level?: ... }。表示文言はユーザー指定のネタコメントであり、数値から導いた判定ではありません。

## データ更新

```powershell
npm run update-data
```

マスターを順番に取得し、未キャッシュの終了済みイベントの最終ランキングを1件ずつ取得、検索用JSONを再生成します。30秒タイムアウト、最大3回再試行、各ランキング間で300ms待機。初回は数分程度かかります。取得済みの有効な最終記録は再利用し、欠損記録は24時間キャッシュ。HTTP失敗は警告を出し他のイベントへ続行します。マスター取得失敗時には生成処理へ進みません。

```powershell
npm run fetch-data    # rawを取得
npm run fetch-borders # マスターを取り直さず最終ランキングを取得
npm run build-data    # ネットワークなしでraw + overrideから再生成
```

データ更新後は `npm test` と `npm run build` を実行し、公開ビルドを更新してください。rawとgeneratedを混在させません。generatedを直接手編集しないでください。

## 手動override

`data/overrides/events.json` のキーはeventId。`src/lib/data/normalize.ts` のOverride型が対応項目です。

```json
{
  "259": {
    "bannerCharacterId": 26,
    "eventScope": "band",
    "gachaIds": [1328],
    "sources": ["https://bushiroad.com/media/f56374ed42e213e6"],
    "notes": ["照合内容・人による指定・未確認点をここに記録"]
  }
}
```

`eventSongs`（名前配列）、`eventSongBands`（バンド名配列）、`memoryTags`（タグと値配列の辞書）、`stampCharacterIds`（人物ID配列）、`seasonTags`、`collaborationTag`も対応しています。空配列で関連ガチャをクリアできます。根拠が確認できていない情報を確定値として入力しないでください。バナー人物の一律自動判定はしません。箱候補のバンド質問はボーナス対象の所属を代用し、UIにその旨を表示します。混合候補のバナー所属不明は不一致扱いしません。

## 検索と質問選択

完全一致AND検索ではありません。一致+3、不一致−1.5、だいたいの回答は重み0.55、わからない・データ欠損は0。だいたいの年は同年+3、前後年+1.5、2年差0、それ以上−1.5。記憶違いでもイベントは除外しません。明示的に「これじゃない」を押したeventIdだけ今回の候補から除外します。

スコアを温度1.4のsoftmaxで質問選択用の重みに変換します。これは統計的に校正された正解確率ではありません。有力候補は最高スコアとの差4以内。全イベントはタイトル検索・ランキング候補に保持します。

最初の4分類は識別力がある場合のみ優先。以降は「情報利得 × answerability × reliability × relevance × dataCoverage × repetitionPenalty」が最大の質問を選びます。情報利得はH(回答)−H(回答|イベント)。多値フィールドに人物が多いだけでは価値を増やしません。人物選択肢は現在の有力候補内から生成します。

上位2件の回答集合のJaccard距離で識別力を計算し、有力候補5件以内ではrelevanceの加点を強めます。網羅率は有力候補内の確率質量と件数の両方で評価。全件同じ、回答済み、データなし、以前聞いた特徴と同じデータの別表現の質問は出しません。質問価値0.002未満は実用上識別力なしとします。

answerabilityWeightはバンド・箱混合・バナー1.0、年0.9、半期0.85、属性0.9、形式0.8、ガチャ／報酬／楽曲0.65、スタンプ0.4、編成0.4〜0.45。実測正解率ではなく調整可能な初期重みです。userMemoryProfileを回答履歴からカテゴリごとに再計算し、不明で倍率0.3、明確な回答で1.6、曖昧な回答で1.2（倍率は0.08〜2に制限）。類似カテゴリの質問1件ごとに重複ペナルティ0.75も掛けます。回答を戻すとプロファイルも戻ります。

追加プールはガチャカード属性、報酬カード属性、楽曲バンド、編成属性・バンド・人物。カード属性は保存済みBestdoriカードマスターのattributeを使用。楽曲バンドはoverride対応のみで、現行データに値がないため出ません。編成の実データはないため、イベントボーナス由来の弱い手がかりと画面で明示し、スコアの重みを下げます。元の属性／ボーナス質問と同じ特徴なら重複抑止します。

将来の主観タグは `src/config/questions.ts` のquestionDefinitionsへ `field: 'tag:school'`、text、category、answerabilityWeight、reliabilityWeightを追加可能。overrideの `memoryTags: { school: ['yes'] }` 等に根拠付きデータを加えて再生成してください。独自のvalues(event)も定義できます。タグデータがなければ質問は出ません。

候補が本当に1件、または有効質問が尽きたら最高スコアの1件を予想。質問がある場合は、有効回答2件以上・confidence 0.85以上・スコア差6以上なら明確に優勢として予想できます。それ以外では、強い上位識別質問（Jaccard距離0.5以上・質問価値0.25以上）が残る間は質問を継続。強い識別質問がなく、有効回答4件以上・confidence 0.7以上・スコア差2.5以上なら予想できます。confidenceは内部softmax重みであり校正済み正解率ではありません。UIにパーセントは表示しません。

質問数5／10等の固定上限はありません。同じ質問を二度選ばない有限プールによって終了します。不明5連打で一覧に進む処理と通常の「候補を見てみる」ボタンは廃止。質問が尽きてもまず1件ずつ予想。救済一覧は「有効質問なし」かつ「3回以上の予想除外」かつ「回答の80%以上が不明、または最高スコア完全同率20件以上」に限定します。全件除外時は再開始画面へ。予想と結果の両方の「これじゃない」で除外して再評価します。

責務はscoreCandidates.ts、featureValues.ts、calculateInformationGain.ts、updateMemoryProfile.ts、selectNextQuestion.ts、shouldGuess.ts、sessionFlow.tsへ分離。重み・閾値は `src/config/search.ts`、質問メタデータは `src/config/questions.ts`。開発モードのconsole.debug / console.tableで選択理由、情報利得・answerability・reliability・relevance・網羅率・重複ペナルティ・最終質問価値、上位confidenceと差、記憶プロファイルを確認できます。一般ユーザー画面には表示しません。

## テスト

`npm test`。90件成功（既存78件＋表示名・共通画像12件）。既存25件を維持し（バナー不明時コメントの期待値は新仕様の過疎へ変更）、追加25件で僅差継続、明確な差で予想、少数でも識別質問継続、記憶プロファイル、ガチャ関連優先、形式の再質問抑止、除外後継続、一覧抑止、質問枯渇で1件予想、救済条件、主観タグ拡張と実データ3ケースを検証します。

ブラウザでも390px幅で6問→アルス・ノヴァ予想、外れ→報酬の追加質問、不明5回→6問目へ継続、全質問不明→まず1件予想、2回の外れまで次候補予想、3回の外れ後のみ救済一覧へ進むことを確認。バナー不明時の過疎コメントも確認しました。以前のMVPで320px幅・1280px幅も横スクロールなしを確認済み。iPhone Safari / Android Chromeの実機検証は未実施です。

`node node_modules/tsx/dist/cli.mjs scripts/demo-search.ts` で実イベント259（6問）、280（6問）、342（5問）の動的経路を再現できます。年だけ「だいたい」、他は記録に合う明確な回答を自動入力するシミュレーションで、人の記憶に対する正解率の測定ではありません。

## Vercel公開

[VercelのVite手順](https://vercel.com/docs/frameworks/frontend/vite)に対応した `vercel.json` を用意しています。Vercelはソース内のJSONを同梱してビルドするだけで、ビルド時にBestdoriへアクセスしません。

所有者が初回認証を済ませた後、プロジェクトルートで：

```powershell
npx vercel login
npx vercel --prod
```

初回だけVercelアカウントのログイン、アカウント／プロジェクト選択が必要です。ブラウザのdashboardがログイン画面へ遷移することを確認しました。この環境ではpnpm経由のVercel CLI 62.4.0 / 61.0.0が `@vercel/cli-auth` の解決エラーで起動できず、公開は未実施です。所有者の通常のnpm環境で上記CLIを使うか、下記GitHub連携から公開できます。FrameworkはVite、Build Commandは `npx --yes pnpm@10.34.6 run build`、Output Directoryは `dist`、Root Directoryはこのルート。環境変数不要です。第三者へ渡す本番URLではDeployment Protectionを無効にし、ログインせず開けることを確認してください。デプロイ後のURLをLINEやDiscordで共有できます。

GitHub自動公開：所有者のGitHubにリポジトリを作成してソースをpush → VercelのNew ProjectでImport → 上記設定でDeploy。その後mainへのpushで自動デプロイ。[VercelのGit連携手順](https://vercel.com/docs/deployments/overview)。まだGitHubリポジトリは作成・pushしていません。

Cloudflare PagesでもBuild Command `pnpm run build`、出力 `dist` で公開可能です。公式画像は追加していません。キャラクター添付画像はそのまま使用しています。

## 未確認・未実装

- 全イベントのバナー画像との照合、箱／混合の公式照合。現状の分類はボーナス対象による暫定値です。
- 古いイベントのガチャ関連、イベント楽曲、ボイススタンプ、季節・コラボの網羅的補完。
- T1〜T10人物別の時系列保存・推定稼働時間・中央値・最長連続区間・最後24時間の分析。`analyze-top10`は未接続を案内するだけです。
- 比較データに基づく通常の過密／過疎判定モデルは未実装。形式・年代をまたいだ未検証閾値は設定しません。データ不足時のバナー基準コメントは実装済みです。
- 実際の個人編成の取得、海外版イベント、途中状態の保存、オフラインPWA。編成からの検索はボーナス由来の弱い手がかりのみ実装。
- 実機Safari / Android検証、公開後の第三者URL検証。

外部データの形が変わった際はadapterとnormalizeを修正してください。現状のマスターは限定的な形検証に留まるため、大きな変更では取得・ビルドが失敗することがあります。既存の生成JSONを保ったうえで調査してください。

## データ不足時のイベントコメント

優先順位は特殊イベント専用 → データによる通常判定 → バナー人物基準 → 人物不明の場合も過疎。`src/lib/data/crowding.ts` に分離し、`classificationSource` をspecial / data / fallbackとして保持します。人物不明時の根拠はdefault:sparse-no-banner。通常判定は根拠付き結果を返すadapterを差し替えられます。現時点では比較モデル未接続で、最終10位ポイントだけでは通常判定が可能とは扱いません。

MyGO!!!!! bandId 45、戸山香澄 characterId 1、湊友希那 characterId 21を過密、その他の既知バナー人物を過疎とします。バナー不明時も「過疎イベじゃーん！走ればよかった🤭」。ボーナス対象の所属文字列でバナーを推測しません。画面に技術用語・判定の説明は出さず、実コメントのみを表示。設定は `src/config/crowding.ts`、文言は `src/config/comments.ts`。

`tests/crowding.test.ts` で優先順位、通常結果の置き換え、IDベース判定、バナー不明、ボーダー欠損、根拠不足を検証します。

## UI・セリフの仕上げ

質問セリフはcomments.questionPromptsの3種類から抽選し、直前のセリフを除外。useQuestionPromptが質問の切り替わりだけを検知し、フィルタ入力や確かさ変更でセリフを再抽選しません。検索エンジンへ乱数を渡しません。

「わからない」は質問画面だけの下部固定ボタン。高さ56px、iPhone用env(safe-area-inset-bottom)の下余白、質問画面の末尾120px＋safe-areaを確保。39人選択肢の開始時・最後で押下位置を確認し、最後の選択肢が覆われないことを確認。320px / 390px / 1280pxで横スクロールなし。safe-areaはCSS対応で、実機Safari検証は未実施です。

結果から「仕様書で指定された特別コメントです。」「バナーキャラをもとにした目安だヨ。」「情報が少ないときのお決まりコメントだヨ。」を削除。内部classificationSource等は保持し、画面に説明ラベルを出しません。複数行は同じ枠内の段落として表示。

新しい添付画像をpublic/yukinator/character.pngへ無加工コピー。元ファイルとのSHA-256一致を確認済み。画像を描き変えず、既存の画像サイズ・object-fit等は維持しています。

## RAS表示名と共通画像表示

表示専用overrideはsrc/config/characterDisplayNames.ts。ID 31レイヤ、32ロック、33マスキング、34パレオ、35チュチュ。src/lib/ui/characterDisplayName.tsで人物IDから表示し、名前だけを持つ既存質問選択肢は元名の別名対応で表示します。クリック時の回答値は元名のまま。選択肢検索は活動名・本名の両方に対応し、検索エンジンやraw／generatedの名前・IDを書き換えません。

画像はsrc/components/yukinator/YukinatorPortrait.tsxに共通化。start / question / guess / resultで最大幅・高さを調整します。旧633×830属性、固定縦長の高さ、楕円枠・白縁・回転を除き、width:auto / height:auto / object-fit:containと幅・高さの上限で元比率を保ちます。スマホで開始310px幅、質問290px、予想300px、結果280pxを上限にし、PC・小さい画面高さでは別上限を使います。新しい縦長／横長画像でもコード上の固定比率に依存しません。

今回の画像添付はないため現在のcharacter.pngを維持。SHA-256は変更なし。実RASイベント280で6問→予想→結果を確認し、ガチャはロック・マスキング・チュチュ、報酬はパレオ・レイヤと表示。320px / 390px / 1280px幅で横スクロールなし、質問の固定「わからない」は引き続きアクセス可能です。実機Safariは未確認です。


