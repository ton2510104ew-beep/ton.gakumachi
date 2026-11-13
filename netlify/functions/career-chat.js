const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MAX_MESSAGES = 20;
const MAX_COMPANIES = 500;
const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const respond = (statusCode, body) => ({ statusCode, headers: jsonHeaders, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: { ...jsonHeaders, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' };
  if (event.httpMethod !== 'POST') return respond(405, { error: 'POSTでリクエストしてください。' });
  if (!process.env.OPENAI_API_KEY) return respond(503, { error: 'AI相談がまだ設定されていません。管理者にお問い合わせください。' });

  try {
    const body = JSON.parse(event.body || '{}');
    if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > MAX_MESSAGES) return respond(400, { error: '会話が長すぎます。相談をリセットして再開してください。' });
    const messages = body.messages.map((message) => {
      if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string' || !message.content.trim() || message.content.length > 1500) throw new Error('メッセージの形式が正しくありません。');
      return { role: message.role, content: message.content.trim() };
    });
    if (messages[messages.length - 1].role !== 'user') return respond(400, { error: 'メッセージを入力してください。' });
    const companies = Array.isArray(body.companies) ? body.companies.slice(0, MAX_COMPANIES).map((company) => ({
      name: String(company?.name || '').slice(0, 100),
      address: String(company?.address || '').slice(0, 180),
      info: String(company?.info || '').slice(0, 160),
      industry: String(company?.industry || '').slice(0, 80)
    })).filter((company) => company.name) : [];

    const result = await openai.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      instructions: `あなたは日本の学生や若者の職業選びを支援する、親切で中立的なキャリア相談AIです。日本語で自然に、決めつけず、対話を続けるために必要な質問を一度に一つ程度してください。年齢・性別などで職業を決めつけないでください。会話が十分になったら、適性の理由を含む仕事の方向性を提案してください。以下の企業一覧にない企業名や事業内容を作らないでください。提示されたデータに合う福井県内企業があれば、企業一覧から最大3社の名前をrecommendationsに入れてください。無理に企業を推薦せず、該当がなければ空配列にしてください。必ずJSONオブジェクトだけを返してください。形式: {"reply":"利用者への返答","recommendations":[{"name":"企業一覧の正確な企業名","reason":"会話との関連理由"}]}. recommendationsのnameは企業一覧に存在する名前だけにしてください。企業データ: ${JSON.stringify(companies)}`,
      input: messages,
      max_output_tokens: 700
    });
    const raw = result.output_text || '';
    let parsed;
    try {
      const json = raw.match(/\{[\s\S]*\}/)?.[0];
      parsed = json ? JSON.parse(json) : null;
    } catch { parsed = null; }
    if (!parsed || typeof parsed.reply !== 'string') return respond(502, { error: 'AIの回答を読み取れませんでした。もう一度お試しください。' });
    const allowed = new Set(companies.map((company) => company.name));
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations.filter((item) => item && allowed.has(item.name)).slice(0, 3).map((item) => ({ name: item.name, reason: String(item.reason || '').slice(0, 240) })) : [];
    return respond(200, { reply: parsed.reply.slice(0, 4000), recommendations });
  } catch (error) {
    if (error instanceof SyntaxError) return respond(400, { error: 'リクエストの形式が正しくありません。' });
    console.error('Career chat request failed:', error);
    return respond(502, { error: 'AIとの通信に失敗しました。しばらくしてからもう一度お試しください。' });
  }
};
