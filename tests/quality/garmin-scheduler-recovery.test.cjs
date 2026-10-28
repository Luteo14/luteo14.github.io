const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const src=fs.readFileSync(path.join(root,'garmin-cloud-worker/src/index.js'),'utf8');
const toml=fs.readFileSync(path.join(root,'garmin-cloud-worker/wrangler.toml'),'utf8');
const fn=src.slice(src.indexOf('function syncLocalParts('),src.indexOf('async function claimSync('));
const context=vm.createContext({Intl,Date,Number,String,Object});
vm.runInContext(fn,context);
const due=(p,date,source='garmin')=>vm.runInContext(`syncDue(${JSON.stringify(p)},new Date(${JSON.stringify(date)}),${JSON.stringify(source)})`,context);
const p={enabled:1,garmin_enabled:1,strava_enabled:0,sync_time:'07:00',timezone:'Europe/Paris'};
test('Bridge sécurisé déclaré et API GET/PUT présentes',()=>{
 assert.match(src,/u\.pathname==='\/sync-settings-bridge'/);
 assert.match(src,/req\.method==='GET'&&u\.pathname==='\/api\/sync-settings'/);
 assert.match(src,/req\.method==='PUT'&&u\.pathname==='\/api\/sync-settings'/);
 assert.match(src,/const email=await owner\(req,env\)/);
});
test('Bridge vérifie origine et nonce et n’expose pas de CORS public',()=>{
 assert.match(src,/e\.origin!==ORIGIN/);
 assert.match(src,/e\.source!==window\.opener/);
 assert.match(src,/e\.data\?\.nonce!==nonce/);
 assert.match(src,/if\(origin&&origin!==u\.origin\)/);
});
test('Cron 15 minutes et gestionnaire scheduled',()=>{
 assert.match(toml,/crons\s*=\s*\["\*\/15 \* \* \* \*"\]/);
 assert.match(src,/async scheduled\(event,env,ctx\)/);
 assert.match(src,/claimSync\(env,email,'garmin',date\)/);
});
test('Garmin non programmé avant 07:00 heure de Paris',()=>{
 assert.equal(due(p,'2026-10-28T05:45:00Z'),null);
 assert.equal(due(p,'2026-10-28T06:00:00Z'),'2026-10-28');
});
test('Heure d’hiver et heure d’été respectées',()=>{
 assert.equal(due(p,'2026-12-01T05:59:00Z'),null);
 assert.equal(due(p,'2026-12-01T06:00:00Z'),'2026-12-01');
 assert.equal(due(p,'2026-07-01T04:59:00Z'),null);
 assert.equal(due(p,'2026-07-01T05:00:00Z'),'2026-07-01');
});
test('Désactivation et source Strava non planifiée',()=>{
 assert.equal(due({...p,enabled:0},'2026-10-28T08:00:00Z'),null);
 assert.equal(due(p,'2026-10-28T08:00:00Z','strava'),null);
});
test('Conservation des routes Garmin, Nutrition, objectifs, entraînements',()=>{
 for(const route of ['/api/snapshot','/api/sync','/api/nutrition','/api/objectives','/api/training/sessions'])assert.ok(src.includes(route),route);
});
