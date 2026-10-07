# GitHub + Vercelで公開する

このプロジェクトはReact / TypeScript / Viteの静的サイトです。Vercelへビルド成果物を配置するため、公開後は所有者のPCを停止していても遊べます。利用者にGitHub・Node.js・Vercel・Bestdoriへのログインを求めません。

## 1. GitHubにソースを送る

このフォルダはmainブランチでGit初期化・公開対象ファイルのステージまで済ませています。まだコミット・リモート作成・pushはしていません。

初心者向けにはGitHub Desktopを使えます。

1. GitHubへログインして、右上の＋ → New repository。名前は `yukinator`。PrivateでもVercelへImportできます。README・.gitignore・Licenseは追加せず、空のリポジトリを作成します。
2. GitHub Desktopでログインし、File → Add Local Repositoryでこのプロジェクトのフォルダを選択。
3. Changesにアプリのファイルが並びます。Summaryへ `Prepare Yukinator for Vercel` を入力してCommit to main。
4. Repository → Repository Settings → Remoteで、GitHubに作ったリポジトリのHTTPS URLを設定。Push originを押します。バージョンによってはPublish repositoryから同等の操作をできます。
5. GitHubのリポジトリ画面でpackage.json、src、public、data/generated/events.json等が見えることを確認。node_modules、dist、.env、元仕様書は含めません。

PowerShellを使う場合は、プロジェクトフォルダへ移動して次を実行します。Git for Windowsが必要です。

```powershell
git status
git add .
git commit -m "Prepare Yukinator for Vercel"
git remote add origin https://github.com/YOUR_ACCOUNT/yukinator.git
git push -u origin main
```

YOUR_ACCOUNTは自分のGitHubアカウント名へ置き換えます。Git認証画面が出たら本人がログインします。初回コミットで名前・メールの設定を求められた場合は、GitHubのSettings → Emailsで確認した自分のnoreplyメール等を使い、このリポジトリのみに設定してください。

```powershell
git config user.name "自分のGitHub表示名"
git config user.email "自分のGitHubのnoreplyメール"
```

## 2. VercelへImport・Deploy

1. https://vercel.com でログイン。Continue with GitHubを選べます。認証は所有者本人が行います。
2. Add New → Project → Import Git Repository。
3. GitHub連携が未設定なら、作ったリポジトリへのアクセスを許可して `yukinator` をImport。
4. 以下の値を確認します。

| 設定 | このプロジェクトの値 |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | リポジトリ直下 `./`（srcやdistではない） |
| Node.js Version | 24.x |
| Install Command | `npx --yes pnpm@10.34.6 install --frozen-lockfile` |
| Build Command | `npx --yes pnpm@10.34.6 run build` |
| Output Directory | `dist` |
| Environment Variables | 不要。空のまま |
| Production Branch | main |

vercel.jsonにFramework・Install・Build・Outputを設定してあります。package.jsonにNode 24.xとpnpm 10.34.6を固定しています。既定値に別の設定が表示されたらこの表に合わせます。

5. Deployを押し、Readyになるまで待ちます。ビルド時にBestdoriへデータを取りに行く必要はありません。
6. ProjectのDomainsに出る本番URL（例 `https://yukinator-xxxxx.vercel.app`）を開きます。これは例で、実際のURLはVercelが発行します。
7. Settings → Deployment Protectionで、本番URLにVercel Authentication／Password Protection等が要求されないことを確認。必要なら本番の保護を外します。Previewの保護は維持して構いません。
8. ブラウザのシークレットモードで本番URLを開き、ログインなしで遊べることを確認。
9. iPhone Safari・Android ChromeでそのURLを開きます。PCとは別回線（携帯回線）でも開始・質問・固定「わからない」・予想・結果・画像・再プレイを確認。
10. 所有者のPCを停止しても同じURLが開くことを確認して、友人へ本番URLを送ります。

## 3. その後の更新

ソースやデータを変更 → テスト・ビルド → git add / commit / push。VercelとGitHubが連携済みならmainへのpushで本番が自動更新されます。

```powershell
npx --yes pnpm@10.34.6 install --frozen-lockfile
npx --yes pnpm@10.34.6 test
npx --yes pnpm@10.34.6 run build
```

イベントを更新する場合だけ `npx --yes pnpm@10.34.6 run update-data` を実行し、生成JSONもコミットします。閲覧者のアクセスごとに更新はしません。

## 公開前に確認したこと

アプリの画像は同じサイトの `/yukinator/character.png`、JS・CSS・JSONはViteがdistへ同梱。Google FontsはHTTPS配信で、読み込みできない場合はシステムフォントへフォールバックします。開発・previewコマンドの127.0.0.1は開発者PC用で、公開ビルドに接続先として入りません。

React Routerは使わず `/` の単一ページだけなのでrewriteは不要。現在のURLの再読み込みはindex.htmlを読み込みます。将来 `/result/123` 等のルートを追加するときはSPA rewriteを改めて検討します。

秘密情報のパターン検索でAPIキー・トークン・パスワード・秘密鍵の一致はなく、.envもありません。.env、鍵、個人設定、node_modules、dist、.vercel、ローカル仕様書はGit対象外。rawのランキングに不要なプレイヤーUIDも除き、今後の取得でも時刻・ポイントだけ保存します。

## 公式資料

- Vite: https://vercel.com/docs/frameworks/frontend/vite
- Package managers: https://vercel.com/docs/package-managers
- Node.js: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- Deployment protection: https://vercel.com/docs/deployment-protection/methods-to-protect-deployments

コードの公開準備と実際の公開は別です。GitHubリポジトリ作成・本人認証・push・Vercel Import / Deployが済むまでは公開URLはありません。
