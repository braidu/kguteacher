// api/visit.js  (선택 사항 — 누적 방문자 카운터)
//
// 이 기능을 쓰려면 Vercel 프로젝트 → Storage 탭에서 KV(Upstash Redis)를
// 하나 만들어 프로젝트에 연결하세요. 연결하면 KV_REST_API_URL /
// KV_REST_API_TOKEN 환경변수가 자동으로 추가됩니다.
//
// 연결하지 않아도 사이트는 정상 작동합니다 — 방문자 배지만 자동으로 숨겨집니다.

module.exports = async function handler(req, res) {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      res.status(200).json({ count: null });
      return;
    }
    const { kv } = await import('@vercel/kv');
    const count = await kv.incr('kgu_visit_count');
    res.status(200).json({ count: count });
  } catch (e) {
    res.status(200).json({ count: null });
  }
};
