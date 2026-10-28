const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {generateKeyPairSync,sign}=require('node:crypto');

const root=resolve(__dirname,'../..');
const source=readFileSync(resolve(root,'garmin-cloud-worker/src/index.js'),'utf8');
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const team='https://qa-luteo.cloudflareaccess.com', aud='qa-audience', email='qa@example.invalid';
const jwk=publicKey.export({format:'jwk'});jwk.kid='qa-key';jwk.alg='RS256';jwk.use='sig';
const originalFetch=global.fetch;
global.fetch=async url=>{
  if(String(url)===team+'/cdn-cgi/access/certs')return new Response(JSON.stringify({keys:[jwk]}),{status:200});
  throw Error('Réseau externe interdit dans les tests QA: '+url);
};
const workerPromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

function token(address=email){
  const head=b64({alg:'RS256',kid:'qa-key',typ:'JWT'});
  const payload=b64({iss:team,aud:[aud],exp:Math.floor(Date.now()/1000)+3600,nbf:0,email:address});
  const message=head+'.'+payload;
  return message+'.'+sign('RSA-SHA256',Buffer.from(message),privateKey).toString('base64url');
}
function fakeDB(){
  const sessions=new Map(),objectives=new Map();
  const stmt=(sql,params=[])=>({
    bind(...args){return stmt(sql,args)},
    async all(){
      if(sql.includes('FROM sport_training_sessions'))return {results:[...sessions.values()].filter(x=>x.owner===params[0]).sort((a,b)=>a.date.localeCompare(b.date)).map(x=>({payload:x.payload}))};
      if(sql.includes('FROM sport_objectives'))return {results:[...objectives.values()].filter(x=>x.owner===params[0]).map(x=>({id:x.id,payload:x.payload,updated_at:x.updated,deleted_at:x.deleted}))};
      throw Error('SQL inattendu all: '+sql);
    },
    async run(){
      if(sql.startsWith('DELETE FROM sport_training_sessions')){for(const [key,v] of sessions)if(v.owner===params[0])sessions.delete(key);return {success:true}};
      if(sql.startsWith('INSERT INTO sport_training_sessions')){const [owner,id,date,payload]=params;sessions.set(owner+'|'+id,{owner,id,date,payload});return {success:true}};
      if(sql.startsWith('INSERT INTO sport_objectives')){const [id,owner,payload,updated]=params;objectives.set(id,{id,owner,payload,updated,deleted:null});return {success:true}};
      if(sql.startsWith('UPDATE sport_objectives')){const [deleted,updated,id,owner]=params;const o=objectives.get(id);if(o&&o.owner===owner){o.deleted=deleted;o.updated=updated}return {success:true}};
      throw Error('SQL inattendu run: '+sql);
    }
  });
  return {prepare:sql=>stmt(sql),async batch(statements){for(const statement of statements)await statement.run();return []},sessions,objectives};
}
const env=db=>({DB:db,ACCESS_TEAM_DOMAIN:team,ACCESS_AUD:aud,ADMIN_EMAIL:email,FRONTEND_ORIGIN:'https://luteo14.github.io'});
async function call(path,{method='GET',body,authorization=true,origin}={},db){
  const {default:worker}=await workerPromise;
  const headers={};
  if(authorization)headers['Cf-Access-Jwt-Assertion']=token();
  if(body!==undefined)headers['Content-Type']='application/json';
  if(origin)headers.Origin=origin;
  const req=new Request('https://qa.example.invalid'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const res=await worker.fetch(req,env(db));
  return {status:res.status,data:await res.json()};
}
const session=(id,km=8)=>({id,date:'2026-11-01',title:'Endurance QA',type:'easy',km,objectiveId:'',notes:''});
test('API: session Cloudflare Access obligatoire',async()=>{
  const db=fakeDB();const r=await call('/api/training/sessions',{authorization:false},db);
  assert.notEqual(r.status,200);
});
test('API: sessions PUT puis GET, modification et suppression',async()=>{
  const db=fakeDB(),s=session('session-0001');
  let r=await call('/api/training/sessions',{method:'PUT',body:[s]},db);
  assert.equal(r.status,200,JSON.stringify(r.data));
  r=await call('/api/training/sessions',{},db);
  assert.equal(r.data.sessions.length,1);assert.equal(r.data.sessions[0].km,8);
  r=await call('/api/training/sessions',{method:'PUT',body:[session('session-0001',12)]},db);
  assert.equal(r.status,200);
  r=await call('/api/training/sessions',{},db);assert.equal(r.data.sessions[0].km,12);
  r=await call('/api/training/sessions',{method:'PUT',body:[]},db);assert.equal(r.status,200);
  r=await call('/api/training/sessions',{},db);assert.equal(r.data.sessions.length,0);
});
test('API: identifiants de séances dupliqués rejetés',async()=>{
  const db=fakeDB(),r=await call('/api/training/sessions',{method:'PUT',body:[session('session-0001'),session('session-0001')]},db);
  assert.equal(r.status,400);assert.equal(db.sessions.size,0);
});
test('API: origine externe rejetée pour PUT',async()=>{
  const db=fakeDB(),r=await call('/api/training/sessions',{method:'PUT',body:[session('session-0001')],origin:'https://evil.invalid'},db);
  assert.equal(r.status,403);assert.equal(db.sessions.size,0);
});
test('API: liste trop grande rejetée',async()=>{
  const db=fakeDB(),list=Array.from({length:251},(_,i)=>session('session-'+String(i).padStart(8,'0')));
  const r=await call('/api/training/sessions',{method:'PUT',body:list},db);
  assert.equal(r.status,400);
});
test('API: objectif créé, relu et supprimé logiquement',async()=>{
  const db=fakeDB(),obj={id:'objective-0001',name:'Marathon QA',date:'2027-11-08',distance:42.195,weeklyKm:40,goal:'04:00:00'};
  let r=await call('/api/objectives',{method:'POST',body:obj},db);
  assert.equal(r.status,200,JSON.stringify(r.data));
  r=await call('/api/objectives',{},db);assert.equal(r.status,200);
  assert.equal(r.data.objectives.length,1);
  r=await call('/api/objectives/objective-0001',{method:'DELETE'},db);assert.equal(r.status,200);
  assert.ok(db.objectives.get('objective-0001').deleted);
});
test('API: rejet d’identifiant objectif invalide',async()=>{
  const db=fakeDB(),r=await call('/api/objectives/bad',{method:'DELETE'},db);
  assert.equal(r.status,400);
});
test('API: séparation des données par propriétaire en lecture',async()=>{
  const db=fakeDB();db.sessions.set('other@example.invalid|session-0002',{owner:'other@example.invalid',id:'session-0002',date:'2026-11-01',payload:JSON.stringify(session('session-0002'))});
  const r=await call('/api/training/sessions',{},db);
  assert.equal(r.status,200);assert.equal(r.data.sessions.length,0);
});
