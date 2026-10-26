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

// Garmin Personal API: Body Battery returns a dated array with descriptor-indexed pairs.
function bodyBatteryLatest(data){
  const list=unwrap(data);
  if(!list)return null;
  const rows=list.filter(x=>x&&typeof x==='object'&&typeof x.date==='string').sort((a,b)=>b.date.localeCompare(a.date));
  for(const row of rows){
    const descriptors=row.bodyBatteryValueDescriptorDTOList||[];
    const levelIndex=descriptors.find(d=>d.bodyBatteryValueDescriptorKey==='bodyBatteryLevel')?.bodyBatteryValueDescriptorIndex;
    const timeIndex=descriptors.find(d=>d.bodyBatteryValueDescriptorKey==='timestamp')?.bodyBatteryValueDescriptorIndex;
    if(!Number.isInteger(levelIndex)||!Number.isInteger(timeIndex))continue;
    const samples=(row.bodyBatteryValuesArray||[]).filter(v=>Array.isArray(v)&&Number.isFinite(v[levelIndex])&&v[levelIndex]>=0&&v[levelIndex]<=100&&Number.isFinite(v[timeIndex]));
    if(!samples.length)continue;
    samples.sort((a,b)=>a[timeIndex]-b[timeIndex]);
    return {value:samples[samples.length-1][levelIndex],date:row.date};
  }
  return null;
}
function showBodyBattery(data){
  const result=bodyBatteryLatest(data);
  $('battery').textContent=result?`${result.value} / 100`:'Non disponible';
  $('batterySource').textContent=result?`Observé · Garmin · ${result.date} · dernière mesure du jour`:'Aucune mesure Body Battery reconnue · Garmin';
}
async function parseGarminJson(file){
  const bytes=new Uint8Array(await file.arrayBuffer());
  let content;
  if(bytes.length>=2&&bytes[0]===0xff&&bytes[1]===0xfe)content=new TextDecoder('utf-16le').decode(bytes.subarray(2));
  else if(bytes.length>=2&&bytes[0]===0xfe&&bytes[1]===0xff)content=new TextDecoder('utf-16be').decode(bytes.subarray(2));
  else content=new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/^\uFEFF/,'');
  return JSON.parse(content);
}

function showMetric(id,sourceId,data,fields,unit='',transform=x=>x){const item=findLatest(data);const v=item?valueAt(item,fields):null;$(id).textContent=v===null?'Non disponible':`${transform(v)}${unit}`;$(sourceId).textContent=v===null?'Champ non reconnu · Garmin':'Observé · Garmin'+(dateAt(item)?' · '+dateAt(item):'')}
async function render(){const datasets={};for(const k of keys)datasets[k]=await dbOp('readonly','get',k);const acts=unwrap(datasets.activities?.data);$('activities').textContent=acts?String(acts.length):'Non disponible';const latest=acts?.slice().sort((a,b)=>String(dateAt(b)||'').localeCompare(String(dateAt(a)||'')))[0];$('lastActivity').textContent=dateAt(latest)||'Non disponible';const sleep=datasets.sleep?.data;showMetric('sleep','sleepSource',sleep,['dailySleepDTO.sleepTimeSeconds','sleepTimeSeconds','sleepDurationInSeconds','totalSleepSeconds','sleepSeconds'],' h',v=>(v/3600).toFixed(1));showBodyBattery(datasets['body-battery']?.data);showMetric('hrv','hrvSource',datasets.hrv?.data,['hrvSummary.lastNightAvg','hrvSummary.weeklyAvg','lastNightAvg','weeklyAvg','hrvValue'],' ms');const imports=Object.values(datasets).filter(Boolean);$('lastSync').textContent=imports.length?'Dernier import local : '+new Date(Math.max(...imports.map(x=>Date.parse(x.importedAt)))).toLocaleString('fr-FR'):'';$('advice').textContent='Les indicateurs affichés sont des mesures Garmin lorsqu’un champ reconnu est présent. Pour évaluer une tendance, il faut plusieurs jours comparables et tenir compte du ressenti. Aucun score de récupération n’est inféré ici.'}
$('garminFiles').addEventListener('change',async e=>{let ok=0,errors=[];for(const f of e.target.files){const type=keys.find(k=>f.name.toLowerCase().startsWith(k+'.')||f.name.toLowerCase().startsWith(k+'_')||f.name.toLowerCase()===k+'.json');if(!type){errors.push(f.name+' : nom attendu sleep.json, body-battery.json, hrv.json ou activities.json');continue}try{if(f.size>12*1024*1024)throw Error('fichier trop volumineux');const data=await parseGarminJson(f);if(!data||typeof data!=='object')throw Error('JSON invalide');await dbOp('readwrite','put',{data,importedAt:new Date().toISOString()},type);ok++}catch(err){errors.push(f.name+' : '+err.message)}}$('status').textContent=`${ok} fichier(s) importé(s). ${errors.join(' ; ')}`;await render();e.target.value=''});
$('clear').addEventListener('click',async()=>{if(!confirm('Supprimer toutes les données Garmin stockées dans ce navigateur ?'))return;await dbOp('readwrite','clear');$('status').textContent='Données Garmin locales supprimées.';await render()});
render().catch(e=>$('status').textContent='Stockage local indisponible : '+e.message);
