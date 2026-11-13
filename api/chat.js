export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POSTリクエストのみ利用できます。' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AIチャットの設定がまだ完了していません。管理者にお問い合わせください。' });
  }

  const body = req.body || {};
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const latestUserMessage = [...messages].reverse().find((message) => message?.role === 'user');
  if (typeof latestUserMessage?.content !== 'string' || !latestUserMessage.content.trim()) {
    return res.status(400).json({ error: '質問を入力してください。' });
  }
  if (latestUserMessage.content.length > 1000) {
    return res.status(400).json({ error: '質問は1000文字以内で入力してください。' });
  }

  const safeMessages = messages.slice(-10)
    .filter((message) => ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string')
    .map((message) => ({ role: message.role, content: message.content.slice(0, 1000) }));
  const companies = Array.isArray(body.companies) ? body.companies.slice(0, 30).map((company) => ({
    name: String(company?.name || '').slice(0, 100),
    address: String(company?.address || '').slice(0, 200),
    info: String(company?.info || '').slice(0, 200)
  })) : [];

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 700,
        messages: [
          {
            role: 'system',
            content: `あなたは「ガクマチ」の福井県内企業・仕事選びアシスタントです。親しみやすい日本語で簡潔に回答してください。掲載企業データにある情報だけを事実として扱い、採用状況・給与・労働条件などデータにないことは推測せず、公式情報で確認するよう案内してください。質問に合う企業があれば、社名と掲載されている事業内容を紹介してください。\n\n掲載企業データ:\n${JSON.stringify(companies)}`
          },
          ...safeMessages
        ]
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (!upstream.ok) {
      console.error('OpenAI API returned status:', upstream.status);
      return res.status(502).json({ error: 'AIから回答を取得できませんでした。時間をおいてもう一度お試しください。' });
    }

    const result = await upstream.json();
    const reply = result.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: 'AIから回答を取得できませんでした。もう一度お試しください。' });
    }
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('AI chat request failed:', error.name || 'Error');
    return res.status(502).json({ error: 'AIチャットに接続できませんでした。時間をおいてもう一度お試しください。' });
  }
}
