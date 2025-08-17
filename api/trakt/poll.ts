export const config = { runtime: 'edge' };

function makeCors(origin: string, allowCSV: string, reqHeaders?: string) {
  const list = (allowCSV || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowCSV === '*' || list.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': reqHeaders || 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin, Access-Control-Request-Headers',
  };
}

export default async function handler(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowCSV = process.env.ALLOWED_ORIGIN || '';
  const acrh = req.headers.get('Access-Control-Request-Headers') || undefined;
  const headers = makeCors(origin, allowCSV, acrh);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST')   return new Response('Method Not Allowed', { status: 405, headers });

  // Accept JSON or simple/plain form (avoids iOS preflight)
  let device_code: string | null = null;
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  try {
    if (ct.includes('application/json')) {
      const b = await req.json(); device_code = b?.device_code ?? b?.code ?? null;
    } else {
      const t = await req.text();
      if (t.includes('=')) { const q = new URLSearchParams(t); device_code = q.get('device_code') || q.get('code'); }
      else device_code = t.trim() || null;
    }
  } catch {}

  if (!device_code) {
    return new Response(JSON.stringify({ error: 'device_code required' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const r = await fetch('https://api.trakt.tv/oauth/device/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': process.env.TRAKT_CLIENT_ID!,
    },
    body: JSON.stringify({
      code: device_code,
      client_id: process.env.TRAKT_CLIENT_ID,
      client_secret: process.env.TRAKT_CLIENT_SECRET,
    }),
  });

  const data = await r.json();

  if (r.ok) {
    return new Response(JSON.stringify({ status: 'ok', ...data }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const err = data?.error || 'unknown_error';
  let status = 'error', nextPollAddSec = 0;
  if (err === 'authorization_pending') status = 'pending';
  if (err === 'slow_down') { status = 'pending'; nextPollAddSec = 5; }
  if (err === 'expired_token') status = 'expired';

  return new Response(JSON.stringify({ status, error: err, nextPollAddSec }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
