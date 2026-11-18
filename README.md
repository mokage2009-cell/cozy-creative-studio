# Cozy Creative Studio

https://github.com/h24376990-ai/cozy-vrm-home.git　取り込んだ後自宅（3Dルーム）の見た目と空間構造を大幅にアップグレードし、画面下のUIをごちゃごちゃさせないスッキリした設計にしてください。

【1. 世界観の統一（アニメ背景美術風）】

・部屋全体、家具、通路の質感を、アニメ風アバターに自然に馴染む「3Dアニメの背景美術風（トゥーン調・温かみのある柔らかいパステル＆ナチュラルカラー・窓から差し込む爽やかな光とやさしい影）」に統一する。

【2. 画面下UIの整理（スッキリ化）】

・画面下に並んでいた「アバター作成」「服デザイン」「モーション作成」などの編集ボタンはすべて画面下から削除し、画面下は「街へ戻る」「チャット」「家具配置」の最小限だけにして3D画面を広く見せる。

【3. 通路と「奥のスタジオ部屋（アバター＆モーション作成専用）」の追加】

・メインルーム（リビング）の奥の壁に「通路（廊下）」を作り、その通路の先に新しい部屋『クリエイティブ・スタジオ（モーション作成兼アバター作成・修正部屋）』を3D空間として建築する。

・通路または奥の部屋のドアをタップすると、アバターが通路を歩いて奥のスタジオ部屋へ移動し、カメラ視点もスタジオ部屋へスムーズに移動する（メインルームの床をタップすれば歩いて戻れる）。

・奥のスタジオ部屋には、大きな全身鏡・明るい照明・ステージ台座を配置する。

【4. スタジオ部屋に入ったときだけ編集パネルを表示】

・アバターが奥の『クリエイティブ・スタジオ』にいる間だけ、画面に以下の専用タブメニューが自動で開くようにする。

  1. 「アバター作成・修正」（性別、身長、体重、顔パーツ、髪型、肌色、複数保存スロットの切り替え）

  2. 「自作服デザイン」（お絵描きキャンバスで描いた柄のリアルタイム反映）

  3. 「モーション作成」（AI動き補助つきで『体育座り』などの連続ポーズを設計・保存できる機能）

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/862c38a0-3dbb-477c-a2a7-a54e4e63ca36).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
