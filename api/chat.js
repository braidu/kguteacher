// api/chat.js
// Vercel Serverless Function — OpenAI 프록시
//
// 이 함수는 서버(Vercel)에서만 실행되며, 여기서 OPENAI_API_KEY를 사용해
// OpenAI를 대신 호출합니다. 학생 브라우저에는 API 키가 절대 노출되지 않습니다.
//
// 설정 방법: Vercel 프로젝트 → Settings → Environment Variables 에서
// OPENAI_API_KEY 라는 이름으로 본인의 sk-... 키를 등록하세요.
// (이 파일이나 다른 코드에 키를 직접 적지 마세요.)

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1분
const RATE_LIMIT_MAX = 8; // 같은 접속(IP)에서 분당 허용하는 최대 요청 수
const hits = new Map(); // 서버리스 함수가 새로 시작될 때마다 초기화되는 간이 메모리 저장소

function isRateLimited(ip) {
  const now = Date.now();
  const prev = hits.get(ip) || [];
  const recent = prev.filter(function (t) {
    return now - t < RATE_LIMIT_WINDOW_MS;
  });
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        '서버에 OPENAI_API_KEY가 설정되어 있지 않습니다. Vercel 프로젝트의 Environment Variables를 확인해주세요.',
    });
    return;
  }

  const ip = (
    (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown') + ''
  )
    .split(',')[0]
    .trim();
  if (isRateLimited(ip)) {
    res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });
    return;
  }

  const messages = req.body && req.body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: '메시지가 비어 있습니다.' });
    return;
  }
  if (messages.length > 30) {
    res
      .status(400)
      .json({ error: '대화가 너무 길어졌습니다. 새로고침 후 다시 시작해주세요.' });
    return;
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 700,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const msg = (data && data.error && data.error.message) || 'OpenAI 요청에 실패했습니다.';
      res.status(upstream.status).json({ error: msg });
      return;
    }

    const reply =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    res.status(200).json({ reply: reply || '' });
  } catch (e) {
    res.status(500).json({ error: '서버 오류: ' + e.message });
  }
};
