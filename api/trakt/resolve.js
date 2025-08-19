// api/trakt/resolve.js
export const config = { runtime: 'edge' };

function cors(origin, allowCSV, reqHeaders){
  const list=(allowCSV||'').split(',').map(s=>s.trim()).filter(Boolean);
  const ok=allowCSV==='*'||list.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok?origin:'null',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers': reqHeaders||'Content-Type',
    'Access-Control-Max-Age':'86400',
    'Vary':'Origin, Access-Control-Request-Headers'
  };
}

async function trakt(path){
  const r = await fetch('https://api.trakt.tv'+path, {
    headers: {
      'trakt-api-version':'2',
      'trakt-api-key': process.env.TRAKT_CLIENT_ID
    }
  });
  if(!r.ok) throw new Error('Trakt '+r.status+' '+path);
  return r.json();
}

export default async function handler(req){
  const origin=req.headers.get('Origin')||'';
  const acrh=req.headers.get('Access-Control-Request-Headers')||undefined;
  const headers=cors(origin,process.env.ALLOWED_ORIGIN||'',acrh);

  if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
  if(req.method!=='POST')   return new Response('Method Not Allowed',{status:405,headers});

  const t = await req.text();
  const q = new URLSearchParams(t);

  const kind = (q.get('kind')||q.get('type')||'').toLowerCase(); // movie | episode
  if(!kind) return new Response(JSON.stringify({error:'kind required'}),{status:400,headers:{...headers,'Content-Type':'application/json'}});

  // If caller already has ids, just pass them through
  const direct = {};
  ['imdb','tmdb','tvdb','trakt'].forEach(k => { const v=q.get(k); if(v) direct[k]=k==='tmdb'||k==='tvdb'||k==='trakt'?Number(v):v; });
  if(Object.keys(direct).length){
    return new Response(JSON.stringify({ kind, ids: direct }, null, 2), { headers:{...headers,'Content-Type':'application/json'} });
  }

  // MOVIE: allow tmdb_movie or imdb_movie keys
  if(kind==='movie'){
    const tmdb = q.get('tmdb_movie'); const imdb = q.get('imdb_movie');
    if(!tmdb && !imdb) return new Response(JSON.stringify({error:'tmdb_movie or imdb_movie required'}),{status:400,headers:{...headers,'Content-Type':'application/json'}});
    // Use Trakt search to resolve to full ids
    const path = tmdb ? `/search/tmdb/${Number(tmdb)}?type=movie` : `/search/imdb/${imdb}?type=movie`;
    const res = await trakt(path);
    const movie = res?.[0]?.movie;
    if(!movie?.ids) return new Response(JSON.stringify({error:'not_found'}),{status:404,headers:{...headers,'Content-Type':'application/json'}});
    return new Response(JSON.stringify({ kind, ids: movie.ids }, null, 2), { headers:{...headers,'Content-Type':'application/json'} });
  }

  // EPISODE: allow episode id OR show+S/E
  if(kind==='episode'){
    // Already episode id?
    const eid = {};
    ['imdb_ep','tmdb_ep','tvdb_ep','trakt_ep'].forEach(k=>{ const v=q.get(k); if(v) eid[k.replace('_ep','')]=k==='tmdb_ep'||k==='tvdb_ep'||k==='trakt_ep'?Number(v):v; });
    if(Object.keys(eid).length){
      return new Response(JSON.stringify({ kind, ids: eid }, null, 2), { headers:{...headers,'Content-Type':'application/json'} });
    }
    // Resolve from show + season + episode
    const season = Number(q.get('season')); const episode = Number(q.get('episode'));
    const tmdbShow = q.get('tmdb_show'); const imdbShow = q.get('imdb_show'); const tvdbShow = q.get('tvdb_show');
    if(!(season>=0) || !(episode>=0) || !(tmdbShow||imdbShow||tvdbShow)){
      return new Response(JSON.stringify({error:'tmdb_show/imdb_show/tvdb_show + season + episode required'}),{status:400,headers:{...headers,'Content-Type':'application/json'}});
    }

    // 1) map external show id -> trakt show slug/id
    let show;
    if (tmdbShow) {
      const s = await trakt(`/search/tmdb/${Number(tmdbShow)}?type=show`);
      show = s?.[0]?.show;
    } else if (imdbShow) {
      const s = await trakt(`/search/imdb/${imdbShow}?type=show`);
      show = s?.[0]?.show;
    } else if (tvdbShow) {
      const s = await trakt(`/search/tvdb/${Number(tvdbShow)}?type=show`);
      show = s?.[0]?.show;
    }
    const slug = show?.ids?.slug || show?.ids?.trakt;
    if(!slug) return new Response(JSON.stringify({error:'show_not_found'}),{status:404,headers:{...headers,'Content-Type':'application/json'}});

    // 2) fetch that episode's ids
    const ep = await trakt(`/shows/${slug}/seasons/${season}/episodes/${episode}`);
    if(!ep?.ids) return new Response(JSON.stringify({error:'episode_not_found'}),{status:404,headers:{...headers,'Content-Type':'application/json'}});
    return new Response(JSON.stringify({ kind, ids: ep.ids }, null, 2), { headers:{...headers,'Content-Type':'application/json'} });
  }

  return new Response(JSON.stringify({error:'invalid kind'}),{status:400,headers:{...headers,'Content-Type':'application/json'}});
}
