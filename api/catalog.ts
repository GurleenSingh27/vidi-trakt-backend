export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  // The rewrite passes ?type=movie&id=trakt-auth
  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'movie';
  const id = url.searchParams.get('id') || 'trakt-auth';

  // Return an empty catalog (enough for Vidi to accept & add)
  const body = { type, id, metas: [] };

  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
