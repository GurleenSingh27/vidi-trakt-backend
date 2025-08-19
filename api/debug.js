export const config = { runtime: 'edge' };

export default async function handler() {
  return new Response(JSON.stringify({
    allowed_origin: process.env.ALLOWED_ORIGIN || null,
    has_client_id: !!process.env.TRAKT_CLIENT_ID,
    has_client_secret: !!process.env.TRAKT_CLIENT_SECRET
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
