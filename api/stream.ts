export const config = { runtime: 'edge' };

// This is your GitHub Pages auth UI:
const AUTH_PAGE = "https://gurleensingh27.github.io/Vidi-trakt-Addon/index.html";

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'movie';
  const id   = url.searchParams.get('id')   || 'connect-trakt';

  // One "stream" that is actually a link to your auth page
  const body = {
    type,
    id,
    streams: [
      {
        title: "Open Trakt Login",
        externalUrl: AUTH_PAGE
      }
    ]
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
