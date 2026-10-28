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
function coachBridge(env){const origin=JSON.stringify(env.FRONTEND_ORIGIN);return new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><title>Mon Coach sécurisé</title><body style="font:16px system-ui;background:#101c32;color:white;padding:2rem"><h1>Mon Coach — connexion sécurisée</h1><p id="state">Connexion établie, récupération des objectifs et préférences…</p><script>const ORIGIN=${origin},nonce=new URLSearchParams(location.hash.slice(1)).get('nonce');function post(type,data={}){if(window.opener&&/^[a-f0-9]{32}$/.test(nonce||''))window.opener.postMessage({source:'luteo-coach-v47',nonce,type,...data},ORIGIN)}async function call(method,path,payload){const r=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:payload?{'Content-Type':'application/json'}:{},body:payload?JSON.stringify(payload):undefined});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||'HTTP '+r.status);return data}async function initial(){try{const [objectives,preferences]=await Promise.all([call('GET','/api/objectives'),call('GET','/api/coach/preferences')]);post('initial',{objectives:objectives.objectives,preferences:preferences.preferences});document.getElementById('state').textContent='Données chargées. Tu peux revenir à Mon Coach.'}catch(e){post('error',{message:e.message});document.getElementById('state').textContent='Erreur : '+e.message}}window.addEventListener('message',async e=>{if(e.origin!==ORIGIN||e.source!==window.opener||e.data?.source!=='luteo-coach-v47'||e.data?.nonce!==nonce)return;if(e.data.action==='save'){try{const r=await call('PUT','/api/coach/preferences',e.data.preferences);post('saved',{updatedAt:r.updatedAt})}catch(err){post('error',{message:err.message})}}});initial();</script></body>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'}})}

function trainingBridge(env){const origin=JSON.stringify(env.FRONTEND_ORIGIN);return new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><title>Plan SPORT sécurisé</title><body style="background:#101c32;color:#fff;font:16px system-ui;padding:2rem"><h1>Plan d'entraînement · LUTEO14</h1><p id="status">Connexion sécurisée…</p><script>
const ORIGIN=${origin},nonce=new URLSearchParams(location.hash.slice(1)).get('nonce');
function post(type,data={}){if(window.opener&&/^[a-f0-9]{32}$/.test(nonce||''))window.opener.postMessage({source:'luteo-plan-v48',nonce,type,...data},ORIGIN)}
async function api(method,path,payload){const r=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:payload?{'Content-Type':'application/json'}:{},body:payload?JSON.stringify(payload):undefined});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||'HTTP '+r.status);return data}
window.addEventListener('message',async e=>{const m=e.data;if(e.origin!==ORIGIN||e.source!==window.opener||m?.source!=='luteo-plan-v48'||m.nonce!==nonce)return;try{if(m.action==='load'){const [sessions,objectives]=await Promise.all([api('GET','/api/training/sessions'),api('GET','/api/objectives')]);post('loaded',{sessions:sessions.sessions,objectives:objectives.objectives})}if(m.action==='save'){const r=await api('PUT','/api/training/sessions',m.sessions);post('saved',{updatedAt:r.updatedAt})}}catch(err){post('error',{message:err.message})}});
post('ready');document.getElementById('status').textContent='Connexion établie. Tu peux revenir à LUTEO14.';
</script></body>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'}})}

function nutritionBridge(env){const origin=JSON.stringify(env.FRONTEND_ORIGIN);return new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nutrition · LUTEO14 Cloud</title><body style="background:#101c32;color:white;font:16px system-ui;padding:2rem"><h1>Nutrition · Synchronisation sécurisée</h1><p id="status">Connexion établie.</p><script>
const ORIGIN=${origin},nonce=new URLSearchParams(location.hash.slice(1)).get('nonce');
function post(type,data={}){if(window.opener&&/^[a-f0-9]{32}$/.test(nonce||''))window.opener.postMessage({source:'luteo-nutrition-v511',nonce,type,...data},ORIGIN)}
async function api(method,data,version){const r=await fetch('/api/nutrition',{method,credentials:'same-origin',cache:'no-store',headers:method==='PUT'?{'Content-Type':'application/json'}:{},body:method==='PUT'?JSON.stringify({data,expectedUpdatedAt:version}):undefined});const result=await r.json().catch(()=>({}));if(!r.ok)throw Error(result.error||'HTTP '+r.status);return result}
window.addEventListener('message',async e=>{const m=e.data;if(e.origin!==ORIGIN||e.source!==window.opener||m?.source!=='luteo-nutrition-v511'||m.nonce!==nonce)return;try{if(m.action==='load'){const r=await api('GET');post('loaded',r)}if(m.action==='save'){const r=await api('PUT',m.data,m.expectedUpdatedAt);post('saved',r)}}catch(err){post('error',{message:err.message})}});
post('ready');
</script></body>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'}})}
function validateNutrition(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Nutrition invalide');
 const {startDate,endDate,persons,choices,checked}=input;
 const day=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00Z'));
 if(!day(startDate)||!day(endDate))throw Error('Dates invalides');
 const span=Math.round((Date.parse(endDate+'T12:00:00Z')-Date.parse(startDate+'T12:00:00Z'))/86400000);
 if(span<0||span>60||!Number.isInteger(persons)||persons<1||persons>12)throw Error('Période ou personnes invalides');
 if(!choices||typeof choices!=='object'||Array.isArray(choices)||!checked||typeof checked!=='object'||Array.isArray(checked))throw Error('Menus invalides');
 if(Object.keys(choices).length>366||Object.keys(checked).length>500)throw Error('Trop de données');
 const cleanChoices={};for(const [date,meals] of Object.entries(choices)){
  if(!day(date)||!meals||typeof meals!=='object'||Array.isArray(meals))throw Error('Repas invalides');
  const clean={};for(const [meal,id] of Object.entries(meals)){
   if(!['Petit-déjeuner','Déjeuner','Dîner','Collation'].includes(meal)||typeof id!=='string'||!/^[a-z0-9_\-]{1,60}$/.test(id))throw Error('Recette invalide');clean[meal]=id;
  }cleanChoices[date]=clean;
 }
 const cleanChecked={};for(const [key,v] of Object.entries(checked)){if(key.length>160||typeof v!=='boolean')throw Error('Liste invalide');cleanChecked[key]=v}
 return {startDate,endDate,persons,choices:cleanChoices,checked:cleanChecked};
}
function cleanTrainingSession(x){if(!x||typeof x!=='object')throw Error('Séance invalide');const id=String(x.id||''),date=String(x.date||''),type=String(x.type||''),km=Number(x.km),title=String(x.title||'').trim(),objectiveId=String(x.objectiveId||'');if(!/^[a-zA-Z0-9-]{8,80}$/.test(id)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T12:00:00Z'))||!['easy','long','tempo','interval','recovery','race'].includes(type)||!Number.isFinite(km)||km<0||km>100||!title||title.length>100||objectiveId.length>80)throw Error('Séance invalide');return {id,date,type,km,title,objectiveId,notes:String(x.notes||'').slice(0,500)}}

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
function syncSettingsBridge(env){const origin=JSON.stringify(env.FRONTEND_ORIGIN);return new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><title>Programmation SPORT</title><body style="background:#101c32;color:white;font:16px system-ui;padding:2rem"><h1>Programmation des données SPORT</h1><p id="state">Connexion sécurisée…</p><script>
const ORIGIN=${origin},nonce=new URLSearchParams(location.hash.slice(1)).get('nonce');
function post(type,payload){if(window.opener&&/^[a-f0-9]{32}$/.test(nonce||''))window.opener.postMessage({source:'luteo-sync-settings-v52',nonce,type,payload},ORIGIN)}
async function api(method,data){const r=await fetch('/api/sync-settings',{method,credentials:'same-origin',cache:'no-store',headers:method==='PUT'?{'Content-Type':'application/json'}:{},body:method==='PUT'?JSON.stringify(data):undefined});const result=await r.json().catch(()=>({}));if(!r.ok)throw Error(result.error||'HTTP '+r.status);return result}
window.addEventListener('message',async e=>{if(e.origin!==ORIGIN||e.source!==window.opener||e.data?.source!=='luteo-sync-settings-v52'||e.data?.nonce!==nonce||e.data?.type!=='save')return;try{await api('PUT',e.data.payload);post('saved',await api('GET'));document.getElementById('state').textContent='Préférences enregistrées.'}catch(err){post('error',{message:err.message});document.getElementById('state').textContent=err.message}});
api('GET').then(d=>{post('loaded',d);document.getElementById('state').textContent='Connecté. Tu peux revenir à Mes données.'}).catch(e=>{post('error',{message:e.message});document.getElementById('state').textContent=e.message});
<\/script></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"}})}

// V5.2 - scheduled synchronization (server-only, no public cron endpoint)
function syncLocalParts(now=new Date(),zone='Europe/Paris'){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
 return {date:`${parts.year}-${parts.month}-${parts.day}`,minute:Number(parts.hour)*60+Number(parts.minute)};
}
function syncDue(p,now=new Date(),source='garmin'){
 if(!p||!Number(p.enabled)||!Number(p[source+'_enabled']))return null;
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.sync_time))return null;
 const local=syncLocalParts(now,p.timezone||'Europe/Paris');
 const [h,m]=p.sync_time.split(':').map(Number);
 // A 15-minute scheduler runs at or after the selected time, once per local date.
 return local.minute>=h*60+m?local.date:null;
}
async function claimSync(env,ownerEmail,source,date){
 const now=new Date().toISOString();const r=await env.DB.prepare('INSERT OR IGNORE INTO sport_sync_runs(owner_email,source,local_date,status,started_at) VALUES(?,?,?,?,?)').bind(ownerEmail,source,date,'running',now).run();
 return (r.meta?.changes||0)>0;
}
async function finishSync(env,ownerEmail,source,date,status,details){
 await env.DB.prepare('UPDATE sport_sync_runs SET status=?,completed_at=?,details=? WHERE owner_email=? AND source=? AND local_date=?').bind(status,new Date().toISOString(),String(details||'').slice(0,300),ownerEmail,source,date).run();
}

export default {async scheduled(event,env,ctx){ctx.waitUntil((async()=>{const email=String(env.ADMIN_EMAIL||'').toLowerCase();if(!email)return;const p=await env.DB.prepare('SELECT * FROM sport_sync_preferences WHERE owner_email=?').bind(email).first();const date=syncDue(p,new Date(event.scheduledTime),'garmin');if(!date||!await claimSync(env,email,'garmin',date))return;try{await syncGarmin(env);await finishSync(env,email,'garmin',date,'success','Snapshot Garmin actualisé')}catch(e){console.error('Scheduled Garmin sync failed:',e.message);await finishSync(env,email,'garmin',date,'failed',e.message)}})())},async fetch(req,env){const u=new URL(req.url);try{
 if(u.pathname==='/health')return response({ok:true});
 // No CORS on private API: authenticated browser navigates to /bridge.
 const email=await owner(req,env);
 if(req.method==='GET'&&u.pathname==='/sync-settings-bridge')return syncSettingsBridge(env);
 if(req.method==='GET'&&u.pathname==='/api/sync-settings'){
  const p=await env.DB.prepare('SELECT * FROM sport_sync_preferences WHERE owner_email=?').bind(email).first();
  const rows=await env.DB.prepare('SELECT source,local_date,status,started_at,completed_at,details FROM sport_sync_runs WHERE owner_email=? ORDER BY started_at DESC LIMIT 20').bind(email).all();
  return response({preferences:p?{enabled:!!p.enabled,time:p.sync_time,timezone:p.timezone,garmin:!!p.garmin_enabled,strava:!!p.strava_enabled}:{enabled:false,time:'07:00',timezone:'Europe/Paris',garmin:true,strava:false},runs:rows.results||[]});
 }
 if(req.method==='PUT'&&u.pathname==='/api/sync-settings'){
  const origin=req.headers.get('Origin');if(origin&&origin!==u.origin)return response({error:'Origine refusée'},403);
  const raw=await req.text();if(raw.length>2000)return response({error:'Requête trop volumineuse'},413);
  let p;try{p=JSON.parse(raw)}catch{return response({error:'JSON invalide'},400)}
  if(!p||typeof p.enabled!=='boolean'||typeof p.garmin!=='boolean'||typeof p.strava!=='boolean'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time)||p.timezone!=='Europe/Paris')return response({error:'Paramètres invalides'},400);
  await env.DB.prepare('INSERT INTO sport_sync_preferences(owner_email,enabled,sync_time,timezone,garmin_enabled,strava_enabled,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(owner_email) DO UPDATE SET enabled=excluded.enabled,sync_time=excluded.sync_time,timezone=excluded.timezone,garmin_enabled=excluded.garmin_enabled,strava_enabled=excluded.strava_enabled,updated_at=excluded.updated_at').bind(email,p.enabled?1:0,p.time,p.timezone,p.garmin?1:0,p.strava?1:0,new Date().toISOString()).run();
  return response({ok:true});
 }

 if(req.method==='GET'&&u.pathname==='/bridge')return bridge(env);


 if(req.method==='GET'&&u.pathname==='/nutrition-bridge')return nutritionBridge(env);
 if(req.method==='GET'&&u.pathname==='/api/nutrition'){
  const row=await env.DB.prepare('SELECT payload,updated_at FROM sport_nutrition_plans WHERE owner_email=?').bind(email).first();
  return response({data:row?JSON.parse(row.payload):null,updatedAt:row?.updated_at||null});
 }
 if(req.method==='PUT'&&u.pathname==='/api/nutrition'){
  const origin=req.headers.get('Origin');if(origin&&origin!==u.origin)return response({error:'Origine refusee'},403);
  const raw=await req.text();if(raw.length>100000)return response({error:'Trop de donnees'},413);
  let payload;try{payload=JSON.parse(raw)}catch{return response({error:'JSON invalide'},400)}
  let data;try{data=validateNutrition(payload.data)}catch(e){return response({error:e.message},400)}
  const previous=await env.DB.prepare('SELECT updated_at FROM sport_nutrition_plans WHERE owner_email=?').bind(email).first();
  const expected=payload.expectedUpdatedAt||null;
  if((previous?.updated_at||null)!==expected)return response({error:'Modifications plus recentes sur un autre appareil. Recharge les menus avant de sauvegarder.'},409);
  const now=new Date().toISOString();
  if(previous){
   const updated=await env.DB.prepare('UPDATE sport_nutrition_plans SET payload=?,updated_at=? WHERE owner_email=? AND updated_at=?').bind(JSON.stringify(data),now,email,previous.updated_at).run();
   if(updated.meta?.changes===0)return response({error:'Conflit de synchronisation'},409);
  }else{
   const result=await env.DB.prepare('INSERT OR IGNORE INTO sport_nutrition_plans(owner_email,payload,updated_at) VALUES(?,?,?)').bind(email,JSON.stringify(data),now).run();
   if(result.meta?.changes===0)return response({error:'Conflit de synchronisation'},409);
  }
  return response({ok:true,updatedAt:now});
 }
 if(req.method==='GET'&&u.pathname==='/training-bridge')return trainingBridge(env);
 if(req.method==='GET'&&u.pathname==='/api/training/sessions'){
  const rows=await env.DB.prepare('SELECT payload FROM sport_training_sessions WHERE owner_email=? ORDER BY session_date,id').bind(email).all();
  return response({sessions:(rows.results||[]).map(x=>JSON.parse(x.payload))});
 }
 if(req.method==='PUT'&&u.pathname==='/api/training/sessions'){
  const origin=req.headers.get('Origin');if(origin&&origin!==u.origin)return response({error:'Origine refusée'},403);
  const raw=await req.text();if(raw.length>100000)return response({error:'Trop de données'},413);
  const input=JSON.parse(raw);if(!Array.isArray(input)||input.length>250)return response({error:'Liste invalide'},400);
  const sessions=input.map(cleanTrainingSession);if(new Set(sessions.map(x=>x.id)).size!==sessions.length)return response({error:'Identifiants dupliqués'},400);
  const now=new Date().toISOString();const batch=[env.DB.prepare('DELETE FROM sport_training_sessions WHERE owner_email=?').bind(email),...sessions.map(x=>env.DB.prepare('INSERT INTO sport_training_sessions(owner_email,id,session_date,payload,updated_at) VALUES(?,?,?,?,?)').bind(email,x.id,x.date,JSON.stringify(x),now))];
  await env.DB.batch(batch);return response({ok:true,count:sessions.length,updatedAt:now});
 }
 if(req.method==='GET'&&u.pathname==='/coach-bridge')return coachBridge(env);
 if(req.method==='GET'&&u.pathname==='/api/coach/preferences'){
  const row=await env.DB.prepare('SELECT payload,updated_at FROM sport_coach_preferences WHERE owner_email=?').bind(email).first();return response({preferences:row?JSON.parse(row.payload):null,updatedAt:row?.updated_at||null});
 }
 if(req.method==='PUT'&&u.pathname==='/api/coach/preferences'){
  const origin=req.headers.get('Origin');if(origin&&origin!==u.origin)return response({error:'Origine refusee'},403);
  const raw=await req.text();if(raw.length>12000)return response({error:'Données trop volumineuses'},413);
  const x=JSON.parse(raw),allowed=['battery','sleep','running','hrv','goal','readiness','week'];
  if(!x||typeof x!=='object'||!Array.isArray(x.order)||!Array.isArray(x.hidden))return response({error:'Préférences invalides'},400);
  const order=[...new Set(x.order.filter(k=>allowed.includes(k)))],hidden=[...new Set(x.hidden.filter(k=>allowed.includes(k)))];
  const km=Number(x.week?.km),sessions=Number(x.week?.sessions);
  const prefs={order,hidden,week:{km:Number.isFinite(km)&&km>=1&&km<=250?km:40,sessions:Number.isInteger(sessions)&&sessions>=1&&sessions<=14?sessions:4}};
  const now=new Date().toISOString();await env.DB.prepare('INSERT INTO sport_coach_preferences(owner_email,payload,updated_at) VALUES(?,?,?) ON CONFLICT(owner_email) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind(email,JSON.stringify(prefs),now).run();return response({ok:true,updatedAt:now});
 }
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
