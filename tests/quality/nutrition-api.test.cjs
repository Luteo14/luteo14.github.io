const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {generateKeyPairSync,sign}=require('node:crypto');
const source=readFileSync(resolve(__dirname,'../../garmin-cloud-worker/src/index.js'),'utf8');
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk=publicKey.export({format:'jwk'});jwk.kid='qa';jwk.use='sig';jwk.alg='RS256';
const team='https://qa-luteo.cloudflareaccess.com',aud='qa-audience',email='qa@example.invalid';
const nativeFetch=global.fetch;
global.fetch=async url=>String(url)===team+'/cdn-cgi/access/certs'?new Response(JSON.stringify({keys:[jwk]})):Promise.reject(Error('Network disabled in QA'));
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function jwt(){const a=b64({alg:'RS256',kid:'qa'}),b=b64({iss:team,aud:[aud],exp:Math.floor(Date.now()/1000)+3600,nbf:0,email});const x=a+'.'+b;return x+'.'+sign('RSA-SHA256',Buffer.from(x),privateKey).toString('base64url')}
function db(){let row=null;return {prepare(sql){return {bind(...p){return {async first(){return row?{payload:row.payload,updated_at:row.updated}:null},async run(){if(sql.startsWith('INSERT')){if(row)return {meta:{changes:0}};row={payload:p[1],updated:p[2]};return {meta:{changes:1}}}if(sql.startsWith('UPDATE')){if(!row||row.updated!==p[3])return {meta:{changes:0}};row={payload:p[0],updated:p[1]};return {meta:{changes:1}}}throw Error('Unexpected SQL: '+sql)}}}}},get row(){return row}}}
const plan={startDate:'2026-10-24',endDate:'2026-11-07',persons:2,choices:{'2026-10-24':{'Déjeuner':'riz_poulet'}},checked:{'riz|g':true}};
async function call(database,method='GET',body,origin,authorized=true){const {default:worker}=await modulePromise;const headers={};if(authorized)headers['Cf-Access-Jwt-Assertion']=jwt();if(origin)headers.Origin=origin;const req=new Request('https://qa.invalid/api/nutrition',{method,headers,body:body===undefined?undefined:JSON.stringify(body)});const r=await worker.fetch(req,{DB:database,ACCESS_TEAM_DOMAIN:team,ACCESS_AUD:aud,ADMIN_EMAIL:email,FRONTEND_ORIGIN:'https://luteo14.github.io'});return {status:r.status,json:await r.json()}}
test('Nutrition D1: authentification obligatoire',async()=>{assert.notEqual((await call(db(),'GET',undefined,undefined,false)).status,200)});
test('Nutrition D1: création, lecture et modification',async()=>{const d=db();let r=await call(d,'PUT',{data:plan,expectedUpdatedAt:null});assert.equal(r.status,200,JSON.stringify(r.json));const version=r.json.updatedAt;r=await call(d);assert.equal(r.json.data.persons,2);assert.equal(r.json.data.startDate,plan.startDate);r=await call(d,'PUT',{data:{...plan,persons:3},expectedUpdatedAt:version});assert.equal(r.status,200);r=await call(d);assert.equal(r.json.data.persons,3)});
test('Nutrition D1: conflit entre appareils rejeté',async()=>{const d=db();await call(d,'PUT',{data:plan,expectedUpdatedAt:null});const r=await call(d,'PUT',{data:{...plan,persons:4},expectedUpdatedAt:null});assert.equal(r.status,409)});
test('Nutrition D1: origine externe rejetée',async()=>{const r=await call(db(),'PUT',{data:plan},'https://evil.invalid');assert.equal(r.status,403)});
test('Nutrition D1: période inversée rejetée',async()=>{const r=await call(db(),'PUT',{data:{...plan,startDate:'2026-11-10',endDate:'2026-11-01'}});assert.equal(r.status,400)});
test('Nutrition D1: période supérieure à 61 jours rejetée',async()=>{const r=await call(db(),'PUT',{data:{...plan,endDate:'2027-02-01'}});assert.equal(r.status,400)});
