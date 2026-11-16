const OpenAI = require('openai');

const MAX_MESSAGES = 20;
const MAX_COMPANIES = 300;
const MAX_REQUEST_BYTES = 200_000;
const MAX_CONVERSATION_CHARS = 12_000;
const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};
const respond = (statusCode, body) => ({
  statusCode,
  headers: jsonHeaders,
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'POSTでリクエストしてください。' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return respond(503, { error: 'AI相談がまだ設定されていません。管理者にお問い合わせください。' });
  }
  if (typeof event.body !== 'string' || Buffer.byteLength(event.body, 'utf8') > MAX_REQUEST_BYTES) {
    return respond(413, { error: 'リクエストが大きすぎます。相談をリセットして再開してください。' });
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return respond(400, { error: 'リクエストの形式が正しくありません。' });
  }

  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > MAX_MESSAGES) {
    return respond(400, { error: '会話が長すぎます。相談をリセットして再開してください。' });
  }

  const messages = [];
  let conversationChars = 0;
  for (const message of body.messages) {
    if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') {
      return respond(400, { error: 'メッセージの形式が正しくありません。' });
    }
    const content = message.content.trim();
    if (!content || content.length > 1500) {
      return respond(400, { error: 'メッセージは1,500文字以内で入力してください。' });
    }
    conversationChars += content.length;
    messages.push({ role: message.role, content });
  }
  if (conversationChars > MAX_CONVERSATION_CHARS) {
    return respond(400, { error: '会話が長すぎます。相談をリセットして再開してください。' });
  }
  if (messages[messages.length - 1].role !== 'user') {
    return respond(400, { error: 'メッセージを入力してください。' });
  }

  const companies = Array.isArray(body.companies)
    ? body.companies.slice(0, MAX_COMPANIES).map((company) => ({
      name: String(company?.name || '').slice(0, 100),
      address: String(company?.address || '').slice(0, 180),
      info: String(company?.info || '').slice(0, 160),
      industry: String(company?.industry || '').slice(0, 80)
    })).filter((company) => company.name)
    : [];

  try {
    // Instantiate only after checking the secret so a missing key returns a useful 503,
    // rather than preventing the serverless function from loading.
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 25_000, maxRetries: 1 });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `あなたは日本の学生や若者の職業選びを支援する、親切で中立的なキャリア相談AIです。日本語で自然に、決めつけず、対話を続けるために必要な質問を一度に一つ程度してください。年齢・性別などで職業を決めつけないでください。会話が十分になったら、適性の理由を含む仕事の方向性を提案してください。以下の企業一覧にない企業名や事業内容を作らないでください。提示されたデータに合う福井県内企業があれば、企業一覧から最大3社をrecommendationsに入れてください。無理に企業を推薦せず、該当がなければ空配列にしてください。必ず指定されたJSON形式だけを返してください。企業データ: ${JSON.stringify(companies)}`
        },
        ...messages
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'career_chat_response',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              reply: { type: 'string' },
              recommendations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    reason: { type: 'string' }
                  },
                  required: ['name', 'reason'],
                  additionalProperties: false
                }
              }
            },
            required: ['reply', 'recommendations'],
            additionalProperties: false
          }
        }
      },
      max_completion_tokens: 700
    });

    const raw = completion.choices?.[0]?.message?.content;
    let parsed;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }
    if (!parsed || typeof parsed.reply !== 'string') {
      return respond(502, { error: 'AIの回答を読み取れませんでした。もう一度お試しください。' });
    }

    const allowed = new Set(companies.map((company) => company.name));
    const recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations
        .filter((item) => item && allowed.has(item.name))
        .slice(0, 3)
        .map((item) => ({ name: item.name, reason: String(item.reason || '').slice(0, 240) }))
      : [];
    return respond(200, { reply: parsed.reply.slice(0, 4000), recommendations });
  } catch (error) {
    console.error('Career chat request failed:', error);
    return respond(502, { error: 'AIとの通信に失敗しました。しばらくしてからもう一度お試しください。' });
  }
};
