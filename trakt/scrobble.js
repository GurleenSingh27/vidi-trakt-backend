// api/trakt/scrobble.js
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
  const allowCSV = process.env.ALLOWED_ORIGIN || '';
  const acrh = req.headers.get('Access-Control-Request-Headers') || undefined;
  const headers = cors(origin, allowCSV, acrh);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST')   return new Response('Method Not Allowed', { status: 405, headers });

  // Accept form-encoded OR JSON (no custom headers needed from client)
  let token=null, action=null, type=null, progress=null;
  const ids = {};
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  try {
    if (ct.includes('application/json')) {
      const b = await req.json();
      token = b.token; action = b.action; type = b.type; progress = b.progress;
      Object.assign(ids, b.ids || {});
    } else {
      const t = await req.text();
      const q = new URLSearchParams(t);
      token = q.get('token'); action = q.get('action'); type = q.get('type'); progress = q.get('progress');
      ['imdb','tvdb','tmdb','trakt'].forEach(k => { const v=q.get(k); if(v) ids[k] = (k==='tvdb'||k==='tmdb'||k==='trakt') ? Number(v) : v; });
    }
  } catch {}

  if (!token || !action || !type || (progress===null && action!=='stop')) {
    return new Response(JSON.stringify({ error: 'token, action, type, and progress (for start/pause) required' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  const ep = action === 'start' ? '/scrobble/start'
          : action === 'pause' ? '/scrobble/pause'
          : action === 'stop'  ? '/scrobble/stop' : null;
  if (!ep) return new Response(JSON.stringify({ error: 'invalid action' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });

  const body = (type === 'movie')
    ? { movie: { ids }, ...(action==='stop'?{}:{ progress: Number(progress) }) }
    : { episode: { ids }, ...(action==='stop'?{}:{ progress: Number(progress) }) }; // type=episode

  const r = await fetch('https://api.trakt.tv' + ep, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': process.env.TRAKT_CLIENT_ID,
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const text = await r.text();
  return new Response(text, {
    status: r.status,
    headers: { ...headers, 'Content-Type': r.headers.get('Content-Type') || 'application/json' }
  });
}
