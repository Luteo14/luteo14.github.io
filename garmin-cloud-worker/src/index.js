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
 return p.email.toLowerCase();
}
function response(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function bridge(env){
 const frontend=JSON.stringify(env.FRONTEND_ORIGIN);
 return new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Garmin Cloud - LUTEO14</title><style>body{font:16px system-ui;background:#101c32;color:white;max-width:680px;margin:8vh auto;padding:24px}button{background:#e94e91;border:0;border-radius:10px;padding:12px 18px;color:white;cursor:pointer;margin:6px}button:disabled{opacity:.5}p{line-height:1.5}</style></head><body><h1>Garmin Cloud - Espace securise</h1><p id="status" role="status">Connexion securisee etablie.</p><button id="sync">Synchroniser Garmin maintenant</button><button id="reload">Charger les donnees enregistrees</button><script>
const ORIGIN=${frontend},nonce=new URLSearchParams(location.hash.slice(1)).get('nonce');
function inform(type,data={}){if(window.opener&&nonce&&/^[a-f0-9]{32}$/.test(nonce))window.opener.postMessage({source:'luteo-garmin-v39',nonce,type,...data},ORIGIN)}
async function snapshot(){const r=await fetch('/api/snapshot',{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('Lecture Cloudflare : HTTP '+r.status);const payload=await r.json();inform('snapshot',{payload});return payload}
async function load(){const el=document.getElementById('status');try{const data=await snapshot();el.textContent='Donnees transmises au tableau de bord. Derniere mise a jour : '+(data.updated_at||'inconnue')}catch(e){el.textContent='Erreur : '+e.message;inform('error',{message:e.message})}}
async function sync(){const b=document.getElementById('sync'),el=document.getElementById('status');b.disabled=true;el.textContent='Synchronisation Garmin en cours, patiente quelques instants...';try{const r=await fetch('/api/sync',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}',cache:'no-store'});const result=await r.json();if(!r.ok)throw Error(result.error||'HTTP '+r.status);const data=await snapshot();el.textContent='Garmin synchronise : '+result.categories+' categories. '+(data.updated_at||'');inform('synced',{result})}catch(e){el.textContent='Erreur de synchronisation : '+e.message;inform('error',{message:e.message})}finally{b.disabled=false}}
document.getElementById('sync').onclick=sync;document.getElementById('reload').onclick=load;load();
</script></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}})
}

function objectivesBridge(env){const origin=JSON.stringify(env.FRONTEND_ORIGIN);return new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Objectifs LUTEO14</title><style>body{font:16px system-ui;background:#101c32;color:white;max-width:680px;margin:8vh auto;padding:24px}p{line-height:1.55}</style><h1>Objectifs SPORT</h1><p id="status">Connexion sécurisée établie. Cette fenêtre permet la synchronisation de tes objectifs entre appareils.</p><script>const ORIGIN=${origin},nonce=new URLSearchParams(location.hash.slice(1)).get('nonce');function post(type,data={}){if(window.opener&&nonce)window.opener.postMessage({source:'luteo-objectives-v44',nonce,type,...data},ORIGIN)}async function api(method,path,body){const r=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||'HTTP '+r.status);return data}window.addEventListener('message',async e=>{if(e.origin!==ORIGIN||e.source!==window.opener)return;const m=e.data;if(!m||m.source!=='luteo-objectives-v44'||m.nonce!==nonce)return;try{if(m.action==='list'){const d=await api('GET','/api/objectives');post('list',d)}else if(m.action==='upsert'){const d=await api('POST','/api/objectives',m.payload);post('saved',d)}else if(m.action==='delete'){const d=await api('DELETE','/api/objectives/'+encodeURIComponent(m.payload.id));post('deleted',d)}}catch(err){post('error',{message:err.message})}});post('ready');</script>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'}})}
function cleanObjective(x){if(!x||typeof x!=='object')throw Error('Objectif invalide');const id=String(x.id||'').slice(0,80),name=String(x.name||'').trim().slice(0,100),date=String(x.date||''),distance=Number(x.distance),weeklyKm=Number(x.weeklyKm||0),goal=String(x.goal||'');if(!/^[a-zA-Z0-9-]{8,80}$/.test(id)||!name||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(distance)||distance<=0||distance>500||!/^\d{1,3}:\d{2}:\d{2}$/.test(goal))throw Error('Objectif invalide');return {id,name,date,distance,goal,weeklyKm:Number.isFinite(weeklyKm)?Math.max(0,Math.min(300,weeklyKm)):0,place:String(x.place||'').slice(0,100),result:String(x.result||'').slice(0,16),stravaUrl:/^https:\/\/(www\.)?strava\.com\//.test(String(x.stravaUrl||''))?String(x.stravaUrl):'',notes:String(x.notes||'').slice(0,3000)}}

const GARMIN_HOST='https://personal.connectapi.garmin.com';
function isoDay(offset){const d=new Date();d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)}
async function getGarminToken(env) {
  if (!env.GARMIN_PERSONAL_API_KEY) {
    throw new Error('Secret GARMIN_PERSONAL_API_KEY absent');
  }

  const url =
    'https://personal.connectapi.garmin.com' +
    '/personalapitoken-service/personal-api/personal-api-key/token';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Authorization': `ApiKey ${env.GARMIN_PERSONAL_API_KEY}`
    },
    signal: AbortSignal.timeout(18000)
  });

  if (!response.ok) {
    throw new Error(
      `Authentification Garmin HTTP ${response.status}`
    );
  }

  // Garmin renvoie directement le bearer token en texte brut.
  const token = (await response.text()).trim();

  if (!token || token.split('.').length !== 3) {
    throw new Error('Jeton Garmin invalide ou non reconnu');
  }

  return token;
}
async function garminGet(token,path){
 const r=await fetch(GARMIN_HOST+path,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(18000)});
 if(!r.ok)throw Error('Garmin HTTP '+r.status+' sur '+path.split('?')[0]);
 return r.status===204?null:await r.json();
}
async function syncGarmin(env){
 const token=await getGarminToken(env);
 const today=isoDay(0),start=isoDay(-27);
 const battery=await garminGet(token,'/wellness-service/wellness/bodyBattery/reports/daily?'+new URLSearchParams({startDate:start,endDate:today,chunks:'1'}));
 const dates=Array.from({length:7},(_,i)=>isoDay(i-6));
 const sleep=[],hrv=[];
 // Requests are sequential to reduce API pressure and avoid unpredictable rate limiting.
 for(const date of dates){
   const s=await garminGet(token,'/sleep-service/sleep/dailySleep?date='+date);
   if(s) sleep.push({...s,calendarDate:s.calendarDate||date});
   const h=await garminGet(token,'/hrv-service/hrv/'+date);
   if(h) hrv.push({...h,calendarDate:h.calendarDate||date});
 }
 const payload={'body-battery':battery,sleep,hrv};
 const now=new Date().toISOString();
 for(const [cat,data] of Object.entries(payload)){
   await env.DB.prepare('INSERT INTO garmin_snapshots(category,payload,updated_at) VALUES(?,?,?) ON CONFLICT(category) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind(cat,JSON.stringify(data),now).run();
 }
 return {ok:true,categories:3,updated_at:now,days:{'body-battery':28,sleep:7,hrv:7}};
}
export default {async fetch(req,env){const u=new URL(req.url);try{
 if(u.pathname==='/health')return response({ok:true});
 // No CORS on private API: authenticated browser navigates to /bridge.
 const email=await owner(req,env);
 if(req.method==='GET'&&u.pathname==='/bridge')return bridge(env);
 if(req.method==='GET'&&u.pathname==='/objectives-bridge')return objectivesBridge(env);
 if(req.method==='GET'&&u.pathname==='/api/objectives'){const rows=await env.DB.prepare('SELECT id,payload,updated_at,deleted_at FROM sport_objectives WHERE owner_email=? ORDER BY updated_at DESC').bind(email).all();return response({objectives:(rows.results||[]).map(r=>({id:r.id,payload:JSON.parse(r.payload),updatedAt:r.updated_at,deletedAt:r.deleted_at}))})}
 if(req.method==='POST'&&u.pathname==='/api/objectives'){const origin=req.headers.get('Origin');if(origin&&origin!==u.origin)return response({error:'Origine refusee'},403);const raw=await req.json();const obj=cleanObjective(raw);const now=new Date().toISOString();await env.DB.prepare('INSERT INTO sport_objectives(id,owner_email,payload,updated_at,deleted_at) VALUES(?,?,?,?,NULL) ON CONFLICT(id) DO UPDATE SET owner_email=excluded.owner_email,payload=excluded.payload,updated_at=excluded.updated_at,deleted_at=NULL').bind(obj.id,email,JSON.stringify(obj),now).run();return response({ok:true,id:obj.id,updatedAt:now})}
 if(req.method==='DELETE'&&u.pathname.startsWith('/api/objectives/')){const id=decodeURIComponent(u.pathname.split('/').pop()||'');if(!/^[a-zA-Z0-9-]{8,80}$/.test(id))return response({error:'Identifiant invalide'},400);const now=new Date().toISOString();await env.DB.prepare('UPDATE sport_objectives SET deleted_at=?,updated_at=? WHERE id=? AND owner_email=?').bind(now,now,id,email).run();return response({ok:true,id,updatedAt:now})}
 if(req.method==='POST'&&u.pathname==='/api/sync'){
   const origin=req.headers.get('Origin');if(origin&&origin!==u.origin)return response({error:'Origine refusee'},403);
   return response(await syncGarmin(env));
 }
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
