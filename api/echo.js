export const config = { runtime: 'edge' };

function cors(origin, allowCSV, reqHeaders){
  const list = (allowCSV || '').split(',').map(s=>s.trim()).filter(Boolean);
  const ok = allowCSV === '*' || list.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': reqHeaders || 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin, Access-Control-Request-Headers'
  };
}

export default async function handler(req){
  const origin = req.headers.get('Origin') || '';
  const acrh = req.headers.get('Access-Control-Request-Headers') || undefined;
  const headers = cors(origin, process.env.ALLOWED_ORIGIN || '', acrh);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  return new Response(JSON.stringify({ ok:true, method:req.method }, null, 2), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
