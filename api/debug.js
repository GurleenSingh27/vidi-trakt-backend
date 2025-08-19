// api/debug.js
export const config = { runtime: 'edge' };

// CORS helper
function cors(origin, allowCSV, reqHeaders) {
  const list = (allowCSV || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowCSV === '*' || list.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': reqHeaders || 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin, Access-Control-Request-Headers'
  };
}

export default async function handler(req) {
  const origin = req.headers.get('Origin') || '';
  const acrh   = req.headers.get('Access-Control-Request-Headers') || undefined;
  const headers = cors(origin, process.env.ALLOWED_ORIGIN || '', acrh);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers });
  }

  const info = {
    url: req.url,
    allowed_origin: process.env.ALLOWED_ORIGIN || null,
    has_client_id: !!process.env.TRAKT_CLIENT_ID,
    has_client_secret: !!process.env.TRAKT_CLIENT_SECRET
  };

  return new Response(JSON.stringify(info, null, 2), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
