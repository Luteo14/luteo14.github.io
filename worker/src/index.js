const STRAVA_AUTH='https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN='https://www.strava.com/oauth/token';
const STRAVA_API='https://www.strava.com/api/v3';
const TOKEN_KEY='single-athlete-token';
const CACHE_KEY='single-athlete-cache';
const MAX_CACHE_MS=7*24*60*60*1000;
// Defense in depth: Cloudflare Access must also protect the entire Worker hostname.
const decodeB64Url=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));
async function requireOwner(req,env){
  const token=req.headers.get('Cf-Access-Jwt-Assertion');
  if(!token||!env.ACCESS_AUD||!env.ACCESS_TEAM_DOMAIN||!env.ADMIN_EMAIL)throw new Error('Access non configure ou session absente');
  const parts=token.split('.');if(parts.length!==3)throw new Error('JWT malforme');
  const header=JSON.parse(new TextDecoder().decode(decodeB64Url(parts[0])));
  const payload=JSON.parse(new TextDecoder().decode(decodeB64Url(parts[1])));
  const team=env.ACCESS_TEAM_DOMAIN.replace(/\/$/,'');
  if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/i.test(team))throw new Error('Domaine Access invalide');
  const now=Math.floor(Date.now()/1000);
  if(header.alg!=='RS256'||!header.kid||payload.iss!==team||!Array.isArray(payload.aud)||!payload.aud.includes(env.ACCESS_AUD)||!payload.exp||payload.exp<=now||payload.nbf>now+60)throw new Error('Identite Access invalide');
  const response=await fetch(team+'/cdn-cgi/access/certs');if(!response.ok)throw new Error('Certificats Access indisponibles');
  const keys=await response.json();const jwk=keys.keys?.find(k=>k.kid===header.kid&&k.kty==='RSA');if(!jwk)throw new Error('Cle Access absente');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decodeB64Url(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw new Error('Signature Access invalide');
  if(typeof payload.email!=='string'||payload.email.toLowerCase()!==env.ADMIN_EMAIL.toLowerCase())throw new Error('Compte non autorise');
  return payload;
}
function sameOrigin(req,env){const origin=req.headers.get('Origin');return !origin||origin===env.FRONTEND_URL||origin===new URL(req.url).origin}


function cors(env,extra={}){return {'Access-Control-Allow-Origin':env.FRONTEND_URL,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Cache-Control':'no-store',...extra}}
function json(env,data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8',...cors(env,extra)}})}
function redirect(url,headers={}){return new Response(null,{status:302,headers:{Location:url,...headers}})}
function randomState(){const a=new Uint8Array(24);crypto.getRandomValues(a);return btoa(String.fromCharCode(...a)).replace(/[+/=]/g,'')}
function cookie(name,value,age=600){return `${name}=${value}; Max-Age=${age}; Path=/; HttpOnly; Secure; SameSite=Lax`}
function readCookie(req,name){const c=req.headers.get('Cookie')||'';return c.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||null}
async function getToken(env){const raw=await env.TOKENS.get(TOKEN_KEY);return raw?JSON.parse(raw):null}
async function putToken(env,t){await env.TOKENS.put(TOKEN_KEY,JSON.stringify(t))}
async function refreshToken(env,t){if(t.expires_at>Date.now()/1000+3600)return t;const body=new URLSearchParams({client_id:env.STRAVA_CLIENT_ID,client_secret:env.STRAVA_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:t.refresh_token});const r=await fetch(STRAVA_TOKEN,{method:'POST',body});if(!r.ok)throw new Error('Impossible de renouveler le jeton Strava');const n=await r.json();const merged={...t,...n,refresh_token:n.refresh_token||t.refresh_token};await putToken(env,merged);return merged}
async function authFetch(env,path,init={}){let t=await getToken(env);if(!t)throw new Error('Compte Strava non connecté');t=await refreshToken(env,t);return fetch(STRAVA_API+path,{...init,headers:{...(init.headers||{}),Authorization:`Bearer ${t.access_token}`}})}
function normalize(a){const type=a.sport_type||a.type||'Autre';let sport=/run/i.test(type)?'Course à pied':/ride|bike|cycling/i.test(type)?'Vélo':/swim/i.test(type)?'Natation':/walk|hike/i.test(type)?'Marche / randonnée':'Autre';return {id:a.id,strava_url:a.id?`https://www.strava.com/activities/${a.id}`:null,date:a.start_date_local||a.start_date,sport,distance_km:(a.distance||0)/1000,duration_s:a.moving_time||a.elapsed_time||0,elevation_m:a.total_elevation_gain||0,avg_hr:a.average_heartrate||null}}
async function fetchActivities(env){let all=[];for(let page=1;page<=20;page++){const r=await authFetch(env,`/athlete/activities?per_page=100&page=${page}`);if(!r.ok)throw new Error(`Strava API ${r.status}`);const batch=await r.json();all.push(...batch.map(normalize));if(batch.length<100)break}const cache={saved_at:new Date().toISOString(),activities:all};await env.TOKENS.put(CACHE_KEY,JSON.stringify(cache),);return cache}
async function revoke(env,t){if(!t)return false;const r=await fetch('https://www.strava.com/oauth/deauthorize',{method:'POST',headers:{Authorization:`Bearer ${t.access_token}`}});if(!r.ok)throw new Error('Reponse de revocation Strava '+r.status);return true}


function bridgePage(env){
 const frontend=JSON.stringify(env.FRONTEND_URL);
 return new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LUTEO14 — Connexion Strava sécurisée</title><style>body{font:16px system-ui;background:#101c32;color:#fff;max-width:620px;margin:12vh auto;padding:24px}button{background:#e94e91;color:white;border:0;border-radius:10px;padding:14px;cursor:pointer}p{line-height:1.6}</style><h1>RUN // DATA — Espace sécurisé</h1><p id="message">Vérification de la connexion…</p><button id="connect" hidden>Autoriser Strava</button><button id="retry" hidden>Réessayer la synchronisation</button><button id="disconnect" style="background:#9c3454">Déconnecter et supprimer</button><script>
const FRONTEND=${frontend};const nonce=new URLSearchParams(location.hash.slice(1)).get('nonce');
function inform(type,data={}){if(window.opener&&nonce)window.opener.postMessage({source:'luteo-strava-bridge-v341',nonce,type,...data},FRONTEND)}
async function run(){const m=document.getElementById('message');try{const r=await fetch('/api/status',{credentials:'same-origin'});if(!r.ok)throw Error('Statut HTTP '+r.status);const status=await r.json();if(!status.connected){m.textContent='Compte Strava non connecté. Autorise la connexion pour continuer.';document.getElementById('connect').hidden=false;inform('status',{status});return}m.textContent='Connexion active. Chargement des activités depuis Strava…';inform('status',{status});const a=await fetch('/api/activities?sync=1',{credentials:'same-origin'});if(!a.ok)throw Error('Synchronisation HTTP '+a.status);const payload=await a.json();if(!Array.isArray(payload.activities))throw Error('Réponse activités invalide');inform('activities',{payload,status});m.textContent=payload.activities.length+' activités transférées au Dashboard. Tu peux fermer cette fenêtre.';document.getElementById('retry').hidden=false}catch(e){m.textContent='Erreur : '+e.message;inform('error',{message:e.message});document.getElementById('retry').hidden=false}}
document.getElementById('connect').onclick=()=>{location.href='/auth/login?nonce='+encodeURIComponent(nonce||'')};document.getElementById('retry').onclick=run;document.getElementById('disconnect').onclick=async()=>{if(!confirm('Révoquer Strava et supprimer les données enregistrées dans Cloudflare ?'))return;try{const r=await fetch('/api/disconnect',{method:'POST',credentials:'same-origin'});if(!r.ok)throw Error('Suppression HTTP '+r.status);const result=await r.json();inform('disconnected',{result});document.getElementById('message').textContent=result.revoked?'Données supprimées et autorisation révoquée.':'Données supprimées, révocation Strava non confirmée.'}catch(e){document.getElementById('message').textContent=e.message}};run();
</script></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'}})
}

export default {async fetch(req,env){const u=new URL(req.url);if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(env)});try{
if(u.pathname==='/health')return json(env,{ok:true});
await requireOwner(req,env);
if(req.method==='POST'&&!sameOrigin(req,env))return json(env,{error:'Origine non autorisee'},403);
if(u.pathname==='/bridge'&&req.method==='GET')return bridgePage(env);
if(u.pathname==='/auth/login'){const nonce=u.searchParams.get('nonce')||'';const state=randomState(),callback=`${u.origin}/auth/callback`;if(nonce&&/^[a-f0-9]{32}$/.test(nonce))await env.TOKENS.put('oauth-nonce:'+state,nonce,{expirationTtl:600});const q=new URLSearchParams({client_id:env.STRAVA_CLIENT_ID,response_type:'code',redirect_uri:callback,approval_prompt:'auto',scope:'read,activity:read_all',state});return redirect(`${STRAVA_AUTH}?${q}`,{'Set-Cookie':cookie('oauth_state',state)})}
if(u.pathname==='/auth/callback'){const expected=readCookie(req,'oauth_state'),state=u.searchParams.get('state'),code=u.searchParams.get('code');if(!code||!state||state!==expected)return json(env,{error:'État OAuth invalide'},400);const body=new URLSearchParams({client_id:env.STRAVA_CLIENT_ID,client_secret:env.STRAVA_CLIENT_SECRET,code,grant_type:'authorization_code'});const r=await fetch(STRAVA_TOKEN,{method:'POST',body});if(!r.ok)return json(env,{error:'Échange OAuth Strava refusé'},400);const t=await r.json();if(env.STRAVA_ATHLETE_ID&&String(t.athlete?.id)!==String(env.STRAVA_ATHLETE_ID))return json(env,{error:'Compte Strava non autorise'},403);await putToken(env,t);await env.TOKENS.delete(CACHE_KEY);const nonce=await env.TOKENS.get('oauth-nonce:'+state);await env.TOKENS.delete('oauth-nonce:'+state);return redirect(nonce?`${u.origin}/bridge#nonce=${nonce}`:`${env.FRONTEND_URL}/sport/dashboard/?strava=connected`,{'Set-Cookie':cookie('oauth_state','',0)})}
if(u.pathname==='/api/status'){const t=await getToken(env),raw=await env.TOKENS.get(CACHE_KEY);const c=raw?JSON.parse(raw):null;return json(env,{connected:!!t,athlete_name:t?.athlete?[t.athlete.firstname,t.athlete.lastname].filter(Boolean).join(' '):null,last_sync:c?.saved_at||null,cached_activities:c?.activities?.length||0})}
if(u.pathname==='/api/activities'){if(!await getToken(env))return json(env,{error:'Compte Strava non connecté'},401);let cache=null,raw=await env.TOKENS.get(CACHE_KEY);if(raw)cache=JSON.parse(raw);const stale=!cache||(Date.now()-new Date(cache.saved_at).getTime()>MAX_CACHE_MS);if(u.searchParams.get('sync')==='1'||stale)cache=await fetchActivities(env);return json(env,{activities:cache.activities,last_sync:cache.saved_at})}
if(u.pathname==='/api/disconnect'&&req.method==='POST'){const t=await getToken(env);await env.TOKENS.delete(TOKEN_KEY);await env.TOKENS.delete(CACHE_KEY);let revoked=false;try{revoked=await revoke(env,t)}catch(e){console.error('Strava deauthorize failed',e.message)}return json(env,{ok:true,revoked})}
if(u.pathname==='/api/data'&&req.method==='DELETE'){await env.TOKENS.delete(TOKEN_KEY);await env.TOKENS.delete(CACHE_KEY);return json(env,{ok:true,deleted:true})}
return json(env,{error:'Route inconnue'},404)
}catch(e){console.error('Strava API:',e.message);return json(env,{error:'Acces refuse ou erreur serveur'},403)}}};
