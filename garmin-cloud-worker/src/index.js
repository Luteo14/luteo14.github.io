const CATEGORIES=['sleep','body-battery','hrv'];
const encoder=new TextEncoder();
function b64url(s){return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0))}
async function owner(req,env){
 const jwt=req.headers.get('Cf-Access-Jwt-Assertion');if(!jwt)throw Error('Session Access absente');
 const parts=jwt.split('.');if(parts.length!==3)throw Error('JWT invalide');
 const head=JSON.parse(new TextDecoder().decode(b64url(parts[0]))),p=JSON.parse(new TextDecoder().decode(b64url(parts[1])));
 const team=env.ACCESS_TEAM_DOMAIN?.replace(/\/$/,'');if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/i.test(team)||!env.ACCESS_AUD||!env.ADMIN_EMAIL)throw Error('Access non configure');
 const now=Math.floor(Date.now()/1000);
 if(head.alg!=='RS256'||!head.kid||p.iss!==team||!Array.isArray(p.aud)||!p.aud.includes(env.ACCESS_AUD)||p.exp<=now||p.nbf>now+60||p.email?.toLowerCase()!==env.ADMIN_EMAIL.toLowerCase())throw Error('Identite refusee');
 const r=await fetch(team+'/cdn-cgi/access/certs');if(!r.ok)throw Error('JWKS indisponible');
 const jwk=(await r.json()).keys?.find(k=>k.kid===head.kid&&k.kty==='RSA');if(!jwk)throw Error('Cle JWT introuvable');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,b64url(parts[2]),encoder.encode(parts[0]+'.'+parts[1])))throw Error('Signature invalide');
}
function response(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function bridge(env){const frontend=JSON.stringify(env.FRONTEND_ORIGIN);return new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Garmin — espace sécurisé</title><style>body{font:16px system-ui;background:#101c32;color:white;max-width:680px;margin:8vh auto;padding:24px}button{background:#e94e91;border:0;border-radius:10px;padding:12px;color:white;cursor:pointer}</style><h1>Garmin Cloud — LUTEO14</h1><p id="status">Chargement des données sauvegardées…</p><button id="reload">Actualiser les données Cloudflare</button><script>const ORIGIN=${frontend},nonce=new URLSearchParams(location.hash.slice(1)).get('nonce');async function load(){try{const r=await fetch('/api/snapshot',{credentials:'same-origin'});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(window.opener&&nonce)window.opener.postMessage({source:'luteo-garmin-v39',nonce,type:'snapshot',payload:data},ORIGIN);document.getElementById('status').textContent='Données Cloudflare transmises au tableau de bord. Dernière mise à jour : '+(data.updated_at||'inconnue')}catch(e){document.getElementById('status').textContent='Erreur : '+e.message}}document.getElementById('reload').onclick=load;load();</script></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'}})}
export default {async fetch(req,env){const u=new URL(req.url);try{
 if(u.pathname==='/health')return response({ok:true});
 // No CORS on private API: authenticated browser navigates to /bridge.
 await owner(req,env);
 if(req.method==='GET'&&u.pathname==='/bridge')return bridge(env);
 if(req.method==='GET'&&u.pathname==='/api/snapshot'){
  const rows=await env.DB.prepare('SELECT category,payload,updated_at FROM garmin_snapshots').all();const out={updated_at:null};
  for(const row of rows.results||[]){out[row.category]=JSON.parse(row.payload);if(!out.updated_at||row.updated_at>out.updated_at)out.updated_at=row.updated_at}return response(out);
 }
 if(req.method==='POST'&&u.pathname==='/api/upload'){
  const origin=req.headers.get('Origin');if(origin&&origin!==u.origin)return response({error:'Origine refusee'},403);
  const len=Number(req.headers.get('Content-Length')||0);if(len>1500000)return response({error:'Charge trop volumineuse'},413);
  const raw=await req.text();if(raw.length>1500000)return response({error:'Charge trop volumineuse'},413);
  const data=JSON.parse(raw);const now=new Date().toISOString();let count=0;
  for(const cat of CATEGORIES){if(data[cat]===undefined)continue;if(typeof data[cat]!=='object'||data[cat]===null)continue;
   await env.DB.prepare('INSERT INTO garmin_snapshots(category,payload,updated_at) VALUES(?,?,?) ON CONFLICT(category) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind(cat,JSON.stringify(data[cat]),now).run();count++}
  return response({ok:true,categories:count,updated_at:now});
 }
 return response({error:'Route inconnue'},404);
 }catch(e){console.error('Garmin Cloud:',e.message);return response({error:'Acces refuse ou erreur serveur'},403)}}};
