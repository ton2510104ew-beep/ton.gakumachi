# AI職業相談のデプロイ設定

現在のサイトは GitHub Pages で公開されていますが、GitHub Pages はサーバー関数を実行できません。AIチャットを動かすには、このリポジトリを Netlify に接続して公開してください。APIキーを HTML や JavaScript に書き込まないでください。

## 必要なもの

- Netlify アカウントと、この GitHub リポジトリへのアクセス
- OpenAI API キーと、API 利用が有効な OpenAI アカウント

## Netlify の設定

1. Netlify で **Add new site → Import an existing project** を選び、このリポジトリを接続します。
2. デプロイするブランチを `feature/ai-career-chat` にします（変更を `main` に取り込んだ後は `main` を選択してください）。`netlify.toml` が公開ディレクトリと Functions の場所を設定します。Build command は空欄で構いません。
3. Netlify のサイト設定で環境変数 `OPENAI_API_KEY` に OpenAI API キーを登録します。任意で `OPENAI_MODEL` を指定できます。未指定時は `gpt-4.1-mini` を使います。
4. 環境変数を設定した後、Netlify で再デプロイします。
5. Netlify が発行した `https://...netlify.app` の URL でサイトを開き、チャットの送受信を確認します。GitHub Pages の URL では Functions が動作しません。独自ドメインを使う場合は Netlify のサイトに設定してください。

## 実装と安全性

- ブラウザーは `/.netlify/functions/career-chat` に会話を送り、Netlify Function が OpenAI API を呼び出します。
- OpenAI API キーは Netlify の環境変数からサーバー上で読み込み、ブラウザーには公開しません。
- リクエストのサイズ、会話の長さ、メッセージ数を制限し、企業推薦は企業データに存在する名前だけに絞っています。
- 入力内容は相談への回答を作るため OpenAI に送信されます。氏名、住所、電話番号などの個人情報をチャットに入力しないでください。
- OpenAI API の利用料金が発生する場合があります。OpenAI 側で利用上限を設定し、利用状況を確認してください。
