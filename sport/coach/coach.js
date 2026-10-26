'use strict';
const $=id=>document.getElementById(id);
const DB_NAME='luteo14-garmin-v38';
function dbOpen(){return new Promise((resolve,reject)=>{const q=indexedDB.open(DB_NAME,1);q.onupgradeneeded=()=>q.result.createObjectStore('exports');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
async function dbOp(mode,method,...args){const db=await dbOpen();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('exports',mode);const req=tx.objectStore('exports')[method](...args);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}finally{db.close()}}
const keys=['sleep','body-battery','hrv','activities'];
function unwrap(data){if(Array.isArray(data))return data;if(data&&typeof data==='object'){for(const k of ['data','results','items','activities'])if(Array.isArray(data[k]))return data[k]}return null}
function valueAt(obj,paths){for(const p of paths){const val=p.split('.').reduce((a,k)=>a?.[k],obj);if(typeof val==='number'&&Number.isFinite(val))return val}return null}
function dateAt(obj){for(const p of ['calendarDate','date','startTimeLocal','startTimeGMT','start_date_local','start_date']){if(typeof obj?.[p]==='string')return obj[p].slice(0,10)}return null}
function findLatest(data){const list=unwrap(data);if(!list)return data;return [...list].filter(x=>x&&typeof x==='object').sort((a,b)=>String(dateAt(b)||'').localeCompare(String(dateAt(a)||'')))[0]||null}
function showMetric(id,sourceId,data,fields,unit='',transform=x=>x){const item=findLatest(data);const v=item?valueAt(item,fields):null;$(id).textContent=v===null?'Non disponible':`${transform(v)}${unit}`;$(sourceId).textContent=v===null?'Champ non reconnu · Garmin':'Observé · Garmin'+(dateAt(item)?' · '+dateAt(item):'')}
function getBodyBattery(data){
  const days=unwrap(data)||((data&&typeof data==='object')?[data]:[]);
  const ordered=days.filter(d=>d&&typeof d==='object').sort((a,b)=>String(dateAt(b)||'').localeCompare(String(dateAt(a)||'')));
  for(const day of ordered){
    const descriptors=day.bodyBatteryValueDescriptorDTOList||[];
    const levelDescriptor=descriptors.find(d=>d.bodyBatteryValueDescriptorKey==='bodyBatteryLevel');
    const timeDescriptor=descriptors.find(d=>d.bodyBatteryValueDescriptorKey==='timestamp');
    const levelIndex=levelDescriptor?.bodyBatteryValueDescriptorIndex??1;
    const timeIndex=timeDescriptor?.bodyBatteryValueDescriptorIndex??0;
    const readings=(day.bodyBatteryValuesArray||[])
      .filter(row=>Array.isArray(row)&&Number.isFinite(Number(row[levelIndex]))&&Number(row[levelIndex])>=0&&Number(row[levelIndex])<=100)
      .sort((a,b)=>Number(b[timeIndex]||0)-Number(a[timeIndex]||0));
    if(readings.length)return {value:Number(readings[0][levelIndex]),date:dateAt(day)};
    const fallback=valueAt(day,['bodyBatteryMostRecentValue','bodyBatteryValue','value']);
    if(fallback!==null)return {value:fallback,date:dateAt(day)};
  }
  return null;
}
function decodeGarminFile(buffer){
  const bytes=new Uint8Array(buffer);
  let encoding='utf-8',offset=0;
  if(bytes.length>=2&&bytes[0]===0xff&&bytes[1]===0xfe){encoding='utf-16le';offset=2}
  else if(bytes.length>=2&&bytes[0]===0xfe&&bytes[1]===0xff){encoding='utf-16be';offset=2}
  else if(bytes.length>=3&&bytes[0]===0xef&&bytes[1]===0xbb&&bytes[2]===0xbf){offset=3}
  else if(bytes.length>=4&&bytes[1]===0&&bytes[3]===0){encoding='utf-16le'}
  return new TextDecoder(encoding,{fatal:true}).decode(bytes.subarray(offset)).replace(/^\uFEFF/,'');
}
function batterySeries(data){
  const days=unwrap(data)||((data&&typeof data==='object')?[data]:[]);
  return days.map(day=>{
    const descriptors=day?.bodyBatteryValueDescriptorDTOList||[];
    const idx=descriptors.find(d=>d.bodyBatteryValueDescriptorKey==='bodyBatteryLevel')?.bodyBatteryValueDescriptorIndex??1;
    const ti=descriptors.find(d=>d.bodyBatteryValueDescriptorKey==='timestamp')?.bodyBatteryValueDescriptorIndex??0;
    const points=(day?.bodyBatteryValuesArray||[]).filter(row=>Array.isArray(row)&&Number.isFinite(Number(row[idx]))&&Number(row[idx])>=0&&Number(row[idx])<=100).sort((a,b)=>Number(a[ti])-Number(b[ti]));
    return {date:dateAt(day),first:points.length?Number(points[0][idx]):null,last:points.length?Number(points[points.length-1][idx]):null,charged:Number.isFinite(day?.charged)?day.charged:null,drained:Number.isFinite(day?.drained)?day.drained:null};
  }).filter(d=>d.date&&d.last!==null).sort((a,b)=>a.date.localeCompare(b.date));
}
function drawBatteryChart(series,days){
  const canvas=$('batteryChart'),note=$('batteryChartNote');if(!canvas)return;
  const end=series.at(-1)?.date;const filtered=end?series.filter(d=>{const delta=(Date.parse(end+'T12:00:00Z')-Date.parse(d.date+'T12:00:00Z'))/86400000;return delta>=0&&delta<days}):[];
  note.textContent=filtered.length?`${filtered.length} jour(s) mesuré(s) sur ${days} jours · dernière valeur quotidienne observée (pas une mesure en temps réel).`:'Aucune mesure disponible sur cette période.';
  const w=canvas.width=900,h=canvas.height=300,ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);
  const pad={left:52,right:18,top:18,bottom:52};const pw=w-pad.left-pad.right,ph=h-pad.top-pad.bottom;
  ctx.font='14px system-ui';ctx.strokeStyle='#536485';ctx.fillStyle='#bdc8e1';ctx.lineWidth=1;
  for(let val=0;val<=100;val+=25){const y=pad.top+ph*(1-val/100);ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(w-pad.right,y);ctx.stroke();ctx.fillText(String(val),10,y+4)}
  if(!filtered.length)return;
  const n=filtered.length;const gap=pw/n;const bw=Math.min(36,gap*.65);
  filtered.forEach((d,i)=>{const x=pad.left+gap*(i+.5),bar=ph*d.last/100;ctx.fillStyle='#f34d91';ctx.fillRect(x-bw/2,pad.top+ph-bar,bw,bar);ctx.fillStyle='#bdc8e1';ctx.textAlign='center';if(n<=10||i%Math.ceil(n/8)===0||i===n-1)ctx.fillText(d.date.slice(5).replace('-','/'),x,h-22)});ctx.textAlign='start';
}
let batteryWindow=7;
async function updateBatteryChart(){const stored=await dbOp('readonly','get','body-battery');drawBatteryChart(batterySeries(stored?.data),batteryWindow)}
$('battery7')?.addEventListener('click',()=>{batteryWindow=7;updateBatteryChart()});
$('battery28')?.addEventListener('click',()=>{batteryWindow=28;updateBatteryChart()});
$('garminSync')?.addEventListener('click',async()=>{
  const btn=$('garminSync'),status=$('status');const token=$('garminSessionToken')?.value.trim();
  if(!token){status.textContent='Démarre le compagnon Python local, puis saisis son code de session temporaire.';return}
  btn.disabled=true;status.textContent='Récupération Garmin en cours (jusqu’à 15 requêtes)…';
  try{
    const r=await fetch('http://127.0.0.1:8765/sync',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}',cache:'no-store'});
    const payload=await r.json();if(!r.ok)throw Error(payload.error||'Erreur HTTP '+r.status);
    for(const k of ['sleep','body-battery','hrv']){
      if(payload[k]!==undefined&&payload[k]!==null)await dbOp('readwrite','put',{data:payload[k],importedAt:payload.synced_at||new Date().toISOString()},k);
    }
    await render();status.textContent='Garmin actualisé sur cet ordinateur. '+(payload.errors?.length?payload.errors.length+' jour(s)/indicateur(s) indisponibles.':'Sommeil, VFC et Body Battery reçus.');
  }catch(e){status.textContent='Actualisation impossible : '+e.message+' · Vérifie que le serveur local est lancé et que le navigateur autorise les connexions au réseau local.'}
  finally{btn.disabled=false}
});
async function render(){const datasets={};for(const k of keys)datasets[k]=await dbOp('readonly','get',k);const acts=unwrap(datasets.activities?.data);$('activities').textContent=acts?String(acts.length):'Non disponible';const latest=acts?.slice().sort((a,b)=>String(dateAt(b)||'').localeCompare(String(dateAt(a)||'')))[0];$('lastActivity').textContent=dateAt(latest)||'Non disponible';const sleep=datasets.sleep?.data;showMetric('sleep','sleepSource',sleep,['dailySleepDTO.sleepTimeSeconds','sleepTimeSeconds','sleepDurationInSeconds','totalSleepSeconds','sleepSeconds'],' h',v=>(v/3600).toFixed(1));const battery=getBodyBattery(datasets['body-battery']?.data);$('battery').textContent=battery?`${battery.value} / 100`:'Non disponible';$('batterySource').textContent=battery?`Observé · Garmin · ${battery.date||'date inconnue'}`:'Champ non reconnu · Garmin';showMetric('hrv','hrvSource',datasets.hrv?.data,['hrvSummary.lastNightAvg','hrvSummary.weeklyAvg','lastNightAvg','weeklyAvg','hrvValue'],' ms');const imports=Object.values(datasets).filter(Boolean);$('lastSync').textContent=imports.length?'Dernier import local : '+new Date(Math.max(...imports.map(x=>Date.parse(x.importedAt)))).toLocaleString('fr-FR'):'';await updateBatteryChart();$('advice').textContent='Les indicateurs affichés sont des mesures Garmin lorsqu’un champ reconnu est présent. Pour évaluer une tendance, il faut plusieurs jours comparables et tenir compte du ressenti. Aucun score de récupération n’est inféré ici.'}
$('garminFiles').addEventListener('change',async e=>{let ok=0,errors=[];for(const f of e.target.files){const type=keys.find(k=>f.name.toLowerCase().startsWith(k+'.')||f.name.toLowerCase().startsWith(k+'_')||f.name.toLowerCase()===k+'.json');if(!type){errors.push(f.name+' : nom attendu sleep.json, body-battery.json, hrv.json ou activities.json');continue}try{if(f.size>12*1024*1024)throw Error('fichier trop volumineux');const data=JSON.parse(decodeGarminFile(await f.arrayBuffer()));if(!data||typeof data!=='object')throw Error('JSON invalide');await dbOp('readwrite','put',{data,importedAt:new Date().toISOString()},type);ok++}catch(err){errors.push(f.name+' : '+err.message)}}$('status').textContent=`${ok} fichier(s) importé(s). ${errors.join(' ; ')}`;await render();e.target.value=''});
$('clear').addEventListener('click',async()=>{if(!confirm('Supprimer toutes les données Garmin stockées dans ce navigateur ?'))return;await dbOp('readwrite','clear');$('status').textContent='Données Garmin locales supprimées.';await render()});
render().catch(e=>$('status').textContent='Stockage local indisponible : '+e.message);

// V3.9 - Cloudflare Access popup bridge (no cross-origin authenticated fetch).
let garminCloudBridge=null;
const GARMIN_CLOUD_BASE='https://luteo-garmin-cloud.luteo-strava-api.workers.dev';
function openGarminCloud(){
 const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
 const popup=window.open(GARMIN_CLOUD_BASE+'/bridge#nonce='+nonce,'luteoGarminCloud','width=700,height=750');
 if(!popup){$('status').textContent='Autorise les fenêtres contextuelles pour actualiser depuis Cloudflare.';return}
 garminCloudBridge={popup,nonce};$('status').textContent='Authentifie-toi dans la fenêtre Cloudflare Access.';
}
$('garminCloudSync')?.addEventListener('click',openGarminCloud);
window.addEventListener('message',async event=>{
 if(!garminCloudBridge||event.origin!==new URL(GARMIN_CLOUD_BASE).origin||event.source!==garminCloudBridge.popup)return;
 const msg=event.data;if(msg?.source!=='luteo-garmin-v39'||msg.nonce!==garminCloudBridge.nonce||msg.type!=='snapshot')return;
 let count=0;
 for(const k of ['sleep','body-battery','hrv'])if(msg.payload?.[k]!==undefined){await dbOp('readwrite','put',{data:msg.payload[k],importedAt:msg.payload.updated_at||new Date().toISOString()},k);count++}
 await render();$('status').textContent=count+' catégories Garmin chargées depuis Cloudflare · '+(msg.payload.updated_at||'date inconnue');garminCloudBridge=null;
});
