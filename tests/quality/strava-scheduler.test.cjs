const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../worker/src/index.js'),'utf8');
const worker=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const prefs=(overrides={})=>({enabled:1,strava_enabled:1,sync_time:'07:00',timezone:'Europe/Paris',...overrides});
function envFor(preferences=prefs(),{token=true,fail=false}={}){
 const runs=new Map(),kv=new Map();
 if(token)kv.set('single-athlete-token',JSON.stringify({access_token:'fictional',refresh_token:'fictional',expires_at:4102444800}));
 const env={ADMIN_EMAIL:'qa@example.invalid',STRAVA_CLIENT_ID:'fake',STRAVA_CLIENT_SECRET:'fake',TOKENS:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v),delete:async k=>kv.delete(k)},DB:{prepare(sql){return {bind(...params){return {async first(){assert.match(sql,/sport_sync_preferences/);return preferences},async run(){if(sql.startsWith('INSERT OR IGNORE')){const key=params.slice(0,3).join('|');if(runs.has(key))return {meta:{changes:0}};runs.set(key,{status:'running'});return {meta:{changes:1}}}if(sql.startsWith('UPDATE sport_sync_runs')){const key=params.slice(3,6).join('|');runs.set(key,{status:params[0],details:params[2]});return {meta:{changes:1}}}throw Error('SQL unexpected '+sql)}}}}}}};
 return {env,runs,kv,fail};
}
async function runAt(state,iso){
 const previous=global.fetch;
 global.fetch=async url=>{
  assert.match(String(url),/www.strava.com\/api\/v3\/athlete\/activities/);
  if(state.fail)return new Response('API error',{status:503});
  return new Response(JSON.stringify([{id:100,sport_type:'Run',distance:10200,moving_time:3600,start_date_local:'2026-10-29T08:00:00Z'}]),{status:200,headers:{'Content-Type':'application/json'}});
 };
 try{
  const w=(await worker).default;
  const tasks=[];
  await w.scheduled({scheduledTime:Date.parse(iso)},state.env,{waitUntil:p=>tasks.push(p)});
  await Promise.all(tasks);
 }finally{global.fetch=previous}
}
test('Cron déclaré et D1 configuré',()=>{
 const toml=fs.readFileSync(path.resolve(__dirname,'../../worker/wrangler.toml'),'utf8');
 assert.match(toml,/\[triggers\]/);assert.match(toml,/\*\/15 \* \* \* \*/);assert.match(toml,/binding = "DB"/);
});
test('Pas de synchronisation si désactivée',async()=>{const s=envFor(prefs({enabled:0}));await runAt(s,'2026-10-29T08:00:00Z');assert.equal(s.runs.size,0)});
test('Pas de synchronisation si Strava non sélectionné',async()=>{const s=envFor(prefs({strava_enabled:0}));await runAt(s,'2026-10-29T08:00:00Z');assert.equal(s.runs.size,0)});
test('Respect heure Paris et anti-doublon quotidien',async()=>{
 const s=envFor();await runAt(s,'2026-10-29T05:45:00Z');assert.equal(s.runs.size,0);
 await runAt(s,'2026-10-29T06:15:00Z');await runAt(s,'2026-10-29T07:00:00Z');
 assert.equal(s.runs.size,1);assert.equal([...s.runs.values()][0].status,'success');
 assert.ok(s.kv.has('single-athlete-cache'));
});
test('Changement heure été/hiver Paris',async()=>{
 const summer=envFor();await runAt(summer,'2026-07-01T05:15:00Z');assert.equal(summer.runs.size,1);
 const winter=envFor();await runAt(winter,'2026-11-01T06:15:00Z');assert.equal(winter.runs.size,1);
});
test('Erreur Strava journalisée sans effacer le cache existant',async()=>{
 const s=envFor(prefs(),{fail:true});s.kv.set('single-athlete-cache','historical-data');
 await runAt(s,'2026-10-29T06:15:00Z');
 assert.equal([...s.runs.values()][0].status,'failed');assert.equal(s.kv.get('single-athlete-cache'),'historical-data');
});
test('Sans jeton Strava, échec enregistré sans secret',async()=>{
 const s=envFor(prefs(),{token:false});await runAt(s,'2026-10-29T06:15:00Z');
 assert.equal([...s.runs.values()][0].status,'failed');
});
