export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'movie';
  const id   = url.searchParams.get('id')   || 'trakt-auth';

  // Single "Connect Trakt" entry
  const body = {
    type,
    id,
    metas: [
      {
        id: "connect-trakt", // will be used by /stream
        type: "movie",
        name: "Connect Trakt",
        poster: "https://i.imgur.com/srGxDgB.png", // optional image, safe to remove
        description: "Open the Trakt login page to link your account.",
        behaviorHints: { defaultVideoId: "connect-trakt" }
      }
    ]
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
