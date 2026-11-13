# AI職業相談のデプロイ設定

## 必要なもの
- Netlifyに接続したこのGitHubリポジトリ
- OpenAI APIキー（ブラウザー側には設定しません）

## 設定
1. Netlifyでこのリポジトリを新しいサイトとしてデプロイします。`netlify.toml` が公開ディレクトリとFunctionsを設定します。
2. Netlifyのサイト設定で環境変数 `OPENAI_API_KEY` にOpenAI APIキーを登録します。任意で `OPENAI_MODEL` を設定できます（未設定時は `gpt-4.1-mini`）。
3. 環境変数を設定後、サイトを再デプロイします。

会話APIは `netlify/functions/career-chat.js` にあり、APIキーはサーバー環境変数からのみ読み込みます。GitHub Pagesはサーバー関数を実行できないため、GitHub PagesのURLではなくNetlifyのデプロイURLで利用してください。チャット入力に氏名・連絡先などの個人情報を入れないよう、画面にも案内を表示しています。
