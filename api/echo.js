export const config = { runtime: 'edge' };
export default async function handler(req) {
  return new Response(JSON.stringify({ ok: true, method: req.method }, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
