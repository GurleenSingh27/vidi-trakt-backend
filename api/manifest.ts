export const config = { runtime: 'edge' };

export default async function handler() {
  // Minimal Stremio-style manifest so Vidi can install
  const manifest = {
    id: "com.gurleen.vidi.trakt",
    version: "1.0.0",
    name: "Trakt Auth Helper",
    description: "Minimal Stremio-style addon so Vidi can install. Use the web UI to connect Trakt.",
    resources: ["catalog"],
    types: ["movie"],
    catalogs: [
      { type: "movie", id: "trakt-auth", name: "Trakt Auth Helper" }
    ],
    behaviorHints: {
      configurable: false,
      configurationRequired: false
    }
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
