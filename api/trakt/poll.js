export const config = { runtime: 'edge' };

function cors(origin, allowCSV, reqHeaders) {
  const list = (allowCSV || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowCSV === '*' || list.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': reqHeaders || 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin, Access-Control-Request-Headers'
  };
}

export default async function handler(req) {
  const origin = req.headers.get('Origin') || '';
  const acrh   = req.headers.get('Access-Control-Request-Headers') || undefined;
  const headers = cors(origin, process.env.ALLOWED_ORIGIN || '', acrh);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST')   return new Response('Method Not Allowed', { status: 405, headers });

  // accept plain text or form body: device_code=...
  let device_code = null;
  try {
    const t = await req.text();
    device_code = t.includes('=') ? new URLSearchParams(t).get('device_code') : t.trim();
  } catch {}
  if (!device_code) {
    return new Response(JSON.stringify({ error: 'device_code required' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  const r = await fetch('https://api.trakt.tv/oauth/device/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': process.env.TRAKT_CLIENT_ID
    },
    body: JSON.stringify({
      code: device_code,
      client_id: process.env.TRAKT_CLIENT_ID,
      client_secret: process.env.TRAKT_CLIENT_SECRET
    })
  });

  const text = await r.text();
  return new Response(text, {
    status: r.status,
    headers: { ...headers, 'Content-Type': r.headers.get('Content-Type') || 'application/json' }
  });
}
