'use strict';
const $=id=>document.getElementById(id);
const DB_NAME='luteo14-garmin-v38';
function dbOpen(){return new Promise((resolve,reject)=>{const q=indexedDB.open(DB_NAME,1);q.onupgradeneeded=()=>q.result.createObjectStore('exports');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
async function dbOp(mode,method,...args){const db=await dbOpen();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('exports',mode);const req=tx.objectStore('exports')[method](...args);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}finally{db.close()}}
const keys=['sleep','body-battery','hrv','activities'];
const coachCharts={};
function coachChart(id,type,labels,datasets,opts={}){const el=$(id);if(!el||typeof Chart==='undefined')return;if(coachCharts[id])coachCharts[id].destroy();const cfg=window.LuteoCharts?.config(type,labels,datasets,opts)||{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false}};coachCharts[id]=new Chart(el,cfg)}
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
  }).filter(d=>d.date).sort((a,b)=>a.date.localeCompare(b.date));
}
function drawBatteryChart(series,days){
  const note=$('batteryChartNote');
  const end=series.at(-1)?.date;
  const filtered=end?series.filter(d=>{const delta=(Date.parse(end+'T12:00:00Z')-Date.parse(d.date+'T12:00:00Z'))/86400000;return delta>=0&&delta<days}):[];
  const levels=filtered.filter(x=>numeric(x.last)!==null);
  const changes=filtered.filter(x=>numeric(x.charged)!==null||numeric(x.drained)!==null);
  if(note)note.textContent=levels.length?`${levels.length}/${days} niveaux Body Battery disponibles.`:
    changes.length?`${changes.length}/${days} jours avec recharge et dépense. Le niveau 0–100 n’est pas fourni par Garmin.`:'Aucune mesure disponible sur cette période.';
  const labels=filtered.map(d=>d.date.slice(5).replace('-','/'));
  if(levels.length){
    coachChart('batteryChart','line',labels,[{label:'Niveau Body Battery (/100)',data:filtered.map(d=>d.last),borderColor:'#74c9f8',backgroundColor:'#74c9f8'}],{hardMin:0,hardMax:100,beginAtZero:true});
  }else{
    coachChart('batteryChart','bar',labels,[
      {label:'Rechargé (points)',data:filtered.map(d=>d.charged),backgroundColor:'#74c9f8'},
      {label:'Dépensé (points)',data:filtered.map(d=>d.drained),backgroundColor:'#f34d91'}
    ],{beginAtZero:true});
  }
}
let batteryWindow=7;
async function updateBatteryChart(){const stored=await dbOp('readonly','get','body-battery');drawBatteryChart(batterySeries(stored?.data),batteryWindow)}
$('battery7')?.addEventListener('click',()=>{batteryWindow=7;updateBatteryChart()});
$('battery28')?.addEventListener('click',()=>{batteryWindow=28;updateBatteryChart()});
async function render(){const datasets={};for(const k of keys)datasets[k]=await dbOp('readonly','get',k);const strava=await readStravaCache();const acts=(strava?.activities||[]).filter(a=>a.sport==='Course à pied');$('activities').textContent=acts.length?String(acts.length):'Non disponible';const latest=acts.slice().sort((a,b)=>String(dateAt(b)||'').localeCompare(String(dateAt(a)||'')))[0];$('lastActivity').textContent=dateAt(latest)||'Non disponible';const sleep=datasets.sleep?.data;showMetric('sleep','sleepSource',sleep,['dailySleepDTO.sleepTimeSeconds','sleepTimeSeconds','sleepDurationInSeconds','totalSleepSeconds','sleepSeconds'],' h',v=>(v/3600).toFixed(1));const battery=getBodyBattery(datasets['body-battery']?.data);const latestBattery=batterySeries(datasets['body-battery']?.data).at(-1);$('battery').textContent=battery?`${battery.value} / 100`:latestBattery&&numeric(latestBattery.charged)!==null?`+${latestBattery.charged} points`:'Non disponible';$('batterySource').textContent=battery?`Niveau observé · Garmin · ${battery.date||'date inconnue'}`:latestBattery&&numeric(latestBattery.charged)!==null?`Recharge quotidienne (pas niveau /100) · Garmin · ${latestBattery.date}`:'Mesure Garmin indisponible';showMetric('hrv','hrvSource',datasets.hrv?.data,['hrvSummary.lastNightAvg','hrvSummary.weeklyAvg','lastNightAvg','weeklyAvg','hrvValue'],' ms');const imports=Object.values(datasets).filter(Boolean);$('lastSync').textContent=imports.length?'Dernière mise à jour : '+new Date(Math.max(...imports.map(x=>Date.parse(x.importedAt)))).toLocaleString('fr-FR'):'';await updateBatteryChart();$('advice').textContent='Les indicateurs Garmin complètent les données d’entraînement Strava. Les tendances se lisent sur plusieurs jours et restent à mettre en regard du ressenti.'}
$('garminFiles')?.addEventListener('change',async e=>{let ok=0,errors=[];for(const f of e.target.files){const type=keys.find(k=>f.name.toLowerCase().startsWith(k+'.')||f.name.toLowerCase().startsWith(k+'_')||f.name.toLowerCase()===k+'.json');if(!type){errors.push(f.name+' : nom attendu sleep.json, body-battery.json, hrv.json ou activities.json');continue}try{if(f.size>12*1024*1024)throw Error('fichier trop volumineux');const data=JSON.parse(decodeGarminFile(await f.arrayBuffer()));if(!data||typeof data!=='object')throw Error('JSON invalide');await dbOp('readwrite','put',{data,importedAt:new Date().toISOString()},type);ok++}catch(err){errors.push(f.name+' : '+err.message)}}$('status').textContent=`${ok} fichier(s) importé(s). ${errors.join(' ; ')}`;await render();e.target.value=''});
$('clear')?.addEventListener('click',async()=>{if(!confirm('Supprimer toutes les données Garmin stockées dans ce navigateur ?'))return;await dbOp('readwrite','clear');$('status').textContent='Données Garmin locales supprimées.';await render()});
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
 const msg=event.data;if(msg?.source!=='luteo-garmin-v39'||msg.nonce!==garminCloudBridge.nonce)return;
  if(msg.type==='error'){$('status').textContent='Garmin Cloud : '+String(msg.message||'Erreur');return}
  if(msg.type==='synced'){$('status').textContent='Synchronisation Garmin Cloudflare terminee.';return}
  if(msg.type!=='snapshot')return;
 let count=0;
 for(const k of ['sleep','body-battery','hrv'])if(msg.payload?.[k]!==undefined){await dbOp('readwrite','put',{data:msg.payload[k],importedAt:msg.payload.updated_at||new Date().toISOString()},k);count++}
 await render();$('status').textContent=count+' catégories Garmin chargées depuis Cloudflare · '+(msg.payload.updated_at||'date inconnue');// Keep the bridge reference for further refreshes from the same secure window.
});

// V4.1 - Analyse croisee des donnees Garmin / cache Strava (lecture seule).
let recoveryWindow=7;
const dateOnly=s=>typeof s==='string'?s.slice(0,10):null;
const numeric=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
function dailySeries(dataset,extract){const list=unwrap(dataset)||(!dataset?[]:[dataset]);return list.map(x=>({date:dateAt(x),value:extract(x)})).filter(x=>x.date&&numeric(x.value)!==null).sort((a,b)=>a.date.localeCompare(b.date))}
function sleepSeries(data){return dailySeries(data,x=>{const s=valueAt(x,['dailySleepDTO.sleepTimeSeconds','sleepTimeSeconds','sleepDurationInSeconds','totalSleepSeconds','sleepSeconds']);return s===null?null:s/3600})}
function hrvSeries(data){return dailySeries(data,x=>valueAt(x,['hrvSummary.lastNightAvg','hrvSummary.weeklyAvg','lastNightAvg','weeklyAvg','hrvValue']))}
function dayList(end,n){const out=[];for(let i=n-1;i>=0;i--){const d=new Date(end+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-i);out.push(d.toISOString().slice(0,10))}return out}
function seriesMap(rows){return new Map(rows.map(x=>[x.date,x.value]))}
function avg(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null}
function trend(rows,dates){const values=seriesMap(rows);const recent=dates.slice(-7).map(d=>values.get(d)).filter(v=>numeric(v)!==null);const prior=dates.slice(-14,-7).map(d=>values.get(d)).filter(v=>numeric(v)!==null);return {recent:avg(recent),prior:avg(prior),n:recent.length,priorN:prior.length}}
function renderMini(canvasId,noteId,rows,dates,unit,ceiling){const c=$(canvasId),note=$(noteId);if(!c)return;const w=c.width=900,h=c.height=230,ctx=c.getContext('2d');ctx.clearRect(0,0,w,h);const byDate=seriesMap(rows),vals=dates.map(d=>byDate.get(d)),known=vals.filter(v=>numeric(v)!==null);note.textContent=`${known.length}/${dates.length} jours disponibles · Source observée`;const left=45,right=15,top=20,bottom=42,pw=w-left-right,ph=h-top-bottom;const max=ceiling||Math.max(1,...known)*1.12;ctx.font='13px system-ui';ctx.strokeStyle='#536485';ctx.fillStyle='#c7d0e5';ctx.textAlign='left';for(let j=0;j<=4;j++){const v=max*j/4,y=top+ph*(1-j/4);ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(w-right,y);ctx.stroke();ctx.fillText(v.toFixed(max<=12?1:0),4,y+4)}const gap=pw/dates.length;dates.forEach((d,i)=>{const v=vals[i],x=left+gap*(i+.5);if(numeric(v)!=null){const bh=Math.min(ph,ph*v/max);if(canvasId==='hrvTrend'){ctx.fillStyle='#74c9f8';ctx.beginPath();ctx.arc(x,top+ph-bh,4,0,Math.PI*2);ctx.fill()}else{ctx.fillStyle=canvasId==='stravaTrend'?'#f34d91':'#74c9f8';ctx.fillRect(x-Math.min(16,gap*.35),top+ph-bh,Math.min(32,gap*.7),bh)}}if(dates.length<=7||i%Math.ceil(dates.length/7)===0||i===dates.length-1){ctx.fillStyle='#c7d0e5';ctx.textAlign='center';ctx.fillText(d.slice(5).replace('-','/'),x,h-12)}});ctx.textAlign='left'}
async function readStravaCache(){return new Promise(resolve=>{let req;try{req=indexedDB.open('luteo14-sport')}catch{return resolve(null)}req.onerror=()=>resolve(null);req.onsuccess=()=>{const db=req.result;if(!db.objectStoreNames.contains('cache')){db.close();return resolve(null)}const tx=db.transaction('cache','readonly'),r=tx.objectStore('cache').get('strava');r.onsuccess=()=>{db.close();resolve(r.result||null)};r.onerror=()=>{db.close();resolve(null)}}})}
function stravaDaily(cache){const m=new Map();for(const a of cache?.activities||[]){if(a.sport!=='Course à pied')continue;const date=dateOnly(a.date);if(!date)continue;const km=Number(a.distance_km);if(!Number.isFinite(km)||km<0)continue;m.set(date,(m.get(date)||0)+km)}return [...m].map(([date,value])=>({date,value})).sort((a,b)=>a.date.localeCompare(b.date))}
function insight(t,goal,missing){const lines=[];if(missing)lines.push('Certaines mesures sont absentes : les conclusions restent limitées.');if(t.km.recent!=null&&t.km.prior!=null&&t.km.prior>0){const ratio=t.km.recent/t.km.prior;if(ratio>1.3)lines.push('Le volume de course sur 7 jours augmente de plus de 30 % par rapport aux 7 jours précédents : vérifier la récupération avant d’ajouter une séance intense.');else if(ratio<.7)lines.push('Le volume récent diminue : cela peut correspondre à un affûtage, à une récupération ou à une interruption.');else lines.push('Le volume de course reste relativement stable sur les deux dernières semaines.')}if(t.sleep.n>=4&&t.sleep.priorN>=4&&t.sleep.recent<t.sleep.prior-.5)lines.push('La durée moyenne de sommeil baisse de plus de 30 minutes : privilégier la régularité du repos.');if(t.hrv.n>=4&&t.hrv.priorN>=4&&t.hrv.recent<t.hrv.prior*.9)lines.push('La VFC moyenne récente est inférieure à la semaine précédente : à interpréter avec ta variabilité habituelle et ton ressenti.');if(t.battery.n>=4&&t.battery.priorN>=4&&t.battery.recent<t.battery.prior-10)lines.push('Les dernières valeurs quotidiennes de Body Battery diminuent : surveiller les sensations, sans conclure à une fatigue clinique.');if(goal==='marathon')lines.push('Objectif marathon : privilégier l’endurance spécifique et respecter les semaines d’affûtage prévues ; ne pas déduire une allure cible de ces seuls indicateurs.');if(goal==='half'||goal==='5k')lines.push('Objectif compétition : conserver des séances de qualité seulement si la récupération et les sensations le permettent.');if(goal==='recovery')lines.push('Objectif reprise : reprendre progressivement et ajuster le volume selon les sensations.');if(!lines.length)lines.push('Historique encore insuffisant pour une tendance robuste. Synchronise Garmin et Strava, puis réévalue sur plusieurs jours.');return lines}
async function renderRecoveryAnalytics(){if(!$('recoveryCoverage'))return;const saved={};for(const k of ['sleep','body-battery','hrv'])saved[k]=await dbOp('readonly','get',k);const strava=await readStravaCache();const series={sleep:sleepSeries(saved.sleep?.data),battery:batterySeries(saved['body-battery']?.data).map(x=>({date:x.date,value:numeric(x.last)??x.charged})),hrv:hrvSeries(saved.hrv?.data),km:stravaDaily(strava)};const latest=[...series.sleep,...series.battery,...series.hrv,...series.km].map(x=>x.date).sort().at(-1);if(!latest){$('recoveryCoverage').textContent='Aucune mesure disponible. Synchronise Garmin et Strava.';return}const dates=dayList(latest,recoveryWindow),trendDates=dayList(latest,14);renderMini('sleepTrend','sleepTrendNote',series.sleep,dates,'h',12);renderMini('hrvTrend','hrvTrendNote',series.hrv,dates,'ms');renderMini('batteryTrend','batteryTrendNote',series.battery,dates,'points',100);if($('batteryTrendNote')&&batterySeries(saved['body-battery']?.data).every(x=>numeric(x.last)===null))$('batteryTrendNote').textContent+=' · Recharge quotidienne (points), pas niveau /100';renderMini('stravaTrend','stravaTrendNote',series.km,dates,'km');const counts=Object.entries(series).map(([k,rows])=>`${k}: ${dates.filter(d=>seriesMap(rows).has(d)).length}/${dates.length}`).join(' · ');const syncTimes=['sleep','body-battery','hrv'].map(k=>saved[k]?.importedAt).filter(Boolean).map(Date.parse).filter(Number.isFinite);const syncLabel=syncTimes.length?new Date(Math.max(...syncTimes)).toLocaleString('fr-FR'):'inconnue';$('recoveryCoverage').textContent=`Période jusqu’au ${latest} · Couverture : ${counts}. · Dernière synchronisation Garmin : ${syncLabel}.`; const trends={};for(const [k,rows]of Object.entries(series))trends[k]=trend(rows,trendDates);const goal=$('coachGoal')?.value||'general',missing=Object.values(trends).some(x=>x.n<4);$('coachInsights').replaceChildren(...insight(trends,goal,missing).map(line=>{const p=document.createElement('p');p.textContent=line;return p}))}
$('recovery7')?.addEventListener('click',()=>{recoveryWindow=7;renderRecoveryAnalytics()});$('recovery28')?.addEventListener('click',()=>{recoveryWindow=28;renderRecoveryAnalytics()});$('coachGoal')?.addEventListener('change',()=>{localStorage.setItem('luteo-coach-goal', $('coachGoal').value);renderRecoveryAnalytics()});try{const g=localStorage.getItem('luteo-coach-goal');if(g&&[...$('coachGoal').options].some(o=>o.value===g))$('coachGoal').value=g}catch{}
// Redessiner apres chaque import ou synchronisation Cloudflare sans toucher au Worker.
const recoveryObserver=new MutationObserver(()=>renderRecoveryAnalytics().catch(console.warn));if($('lastSync'))recoveryObserver.observe($('lastSync'),{childList:true,characterData:true,subtree:true});renderRecoveryAnalytics().catch(console.warn);


/* V4.5 — Cartes Focus inspirées de la densité d'information Garmin Connect.
   Données observées uniquement, aucun chiffre de démonstration. */
function focusNumber(n,decimals=0){return Number.isFinite(n)?n.toLocaleString('fr-FR',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}):'—'}
function focusDate(d){if(!d)return 'Date indisponible';const parts=d.split('-');return parts.length===3?`${parts[2]}/${parts[1]}/${parts[0]}`:d}
function focusTrendChart(id,days,rows,type,color,ceiling){
 const map=new Map(rows.map(x=>[x.date,x.value]));
 const labels=days.map(x=>x.slice(5).replace('-','/'));
 const data=days.map(x=>map.has(x)?map.get(x):null);
 coachChart(id,type,labels,[{label:'Mesures observées',data,backgroundColor:color,borderColor:color,pointRadius:2,spanGaps:false}],{
  legend:false,hardMin:0,hardMax:ceiling,beginAtZero:true,xTicks:4
 });
}
async function renderCoachFocus(){
 if(!$('coachFocus'))return;
 const [batteryRecord,sleepRecord,hrvRecord,strava]=await Promise.all([
  dbOp('readonly','get','body-battery'),dbOp('readonly','get','sleep'),dbOp('readonly','get','hrv'),readStravaCache()
 ]);
 const batteryRows=batterySeries(batteryRecord?.data).map(x=>({date:x.date,value:numeric(x.last)??x.charged,hasLevel:numeric(x.last)!==null}));
 const sleepRows=sleepSeries(sleepRecord?.data),hrvRows=hrvSeries(hrvRecord?.data),runRows=stravaDaily(strava);
 const lastBattery=batteryRows.at(-1),lastSleep=sleepRows.at(-1),lastHrv=hrvRows.at(-1);
 $('focusBattery').textContent=lastBattery?(lastBattery.hasLevel?focusNumber(lastBattery.value):'+'+focusNumber(lastBattery.value)):'—';
 $('focusBatteryDate').textContent=lastBattery?(lastBattery.hasLevel?'Niveau mesuré le ':'Recharge en points le ')+focusDate(lastBattery.date):'Mesure non disponible';
 $('focusSleep').textContent=lastSleep?focusNumber(lastSleep.value,1)+' h':'—';
 $('focusSleepDate').textContent=lastSleep?'Nuit du '+focusDate(lastSleep.date):'Mesure non disponible';
 $('focusHrv').textContent=focusNumber(lastHrv?.value);
 $('focusHrvDate').textContent=lastHrv?'Nuit du '+focusDate(lastHrv.date):'Mesure non disponible';
 const latest=[...batteryRows,...sleepRows,...hrvRows,...runRows].map(x=>x.date).sort().at(-1);
 if(!latest)return;
 const dates=dayList(latest,7);
 const total=runRows.filter(x=>dates.includes(x.date)).reduce((s,x)=>s+x.value,0);
 const runs=runRows.filter(x=>dates.includes(x.date)).length;
 $('focusDistance').textContent=strava?.activities?focusNumber(total,1):'—';
 $('focusDistanceDetail').textContent=strava?.activities?`${runs} jour(s) avec course · période du ${focusDate(dates[0])} au ${focusDate(latest)}`:'Activités non chargées sur cet appareil';
 focusTrendChart('focusBatteryChart',dates,batteryRows,'line','#f34d91',100);
 focusTrendChart('focusSleepChart',dates,sleepRows,'bar','#74c9f8',12);
 focusTrendChart('focusRunningChart',dates,runRows,'bar','#f34d91');
 focusTrendChart('focusHrvChart',dates,hrvRows,'line','#a18cfb');
}
/* Les imports et transferts Cloudflare actualisent déjà #lastSync. */
if($('lastSync')){
 const focusObserver=new MutationObserver(()=>renderCoachFocus().catch(console.warn));
 focusObserver.observe($('lastSync'),{childList:true,characterData:true,subtree:true});
}
renderCoachFocus().catch(console.warn);


/* V4.6 — pilotage personnel : pas de score clinique ni de valeur déduite des données manquantes. */
(function(){
 const prefKey='luteo-coach-v46-cards', weekKey='luteo-coach-v46-week', feelingKey='luteo-coach-v46-feeling';
 const grid=document.querySelector('#coachFocus .focus-grid');if(!grid)return;
 const cards=[...grid.querySelectorAll('[data-focus-key]')];const ids=cards.map(c=>c.dataset.focusKey);
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
 const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
 let prefs=read(prefKey,{order:ids,hidden:[]});
 function normalize(){prefs.order=[...new Set([...(Array.isArray(prefs.order)?prefs.order:[]),...ids])].filter(x=>ids.includes(x));prefs.hidden=(Array.isArray(prefs.hidden)?prefs.hidden:[]).filter(x=>ids.includes(x))}
 function drawPrefs(){normalize();const holder=$('focusPreferenceList');if(!holder)return;holder.replaceChildren();for(const [i,k] of prefs.order.entries()){const card=cards.find(c=>c.dataset.focusKey===k),row=document.createElement('div');row.className='focus-preference-row';const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=!prefs.hidden.includes(k);input.addEventListener('change',()=>{prefs.hidden=input.checked?prefs.hidden.filter(x=>x!==k):[...new Set([...prefs.hidden,k])];apply()});label.append(input,document.createTextNode(' '+(card.querySelector('h3')?.textContent||k)));row.append(label);for(const [txt,diff] of [['↑',-1],['↓',1]]){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=txt;b.setAttribute('aria-label',txt==='↑'?'Monter '+k:'Descendre '+k);b.disabled=i+diff<0||i+diff>=prefs.order.length;b.onclick=()=>{const dest=i+diff;[prefs.order[i],prefs.order[dest]]=[prefs.order[dest],prefs.order[i]];apply()};row.append(b)}holder.append(row)}}
 function apply(){normalize();for(const key of prefs.order){const card=cards.find(c=>c.dataset.focusKey===key);if(!card)continue;grid.append(card);card.hidden=prefs.hidden.includes(key)}write(prefKey,prefs);drawPrefs();window.coachV47?.save()}
 $('focusCustomize')?.addEventListener('click',()=>{const el=$('focusPreferences'),opened=el.hidden;el.hidden=!opened;$('focusCustomize').setAttribute('aria-expanded',String(opened))});
 $('focusReset')?.addEventListener('click',()=>{prefs={order:[...ids],hidden:[]};apply()});
 apply();
 const stored=read(weekKey,{km:40,sessions:4});for(const [id,v] of [['weekKmTarget',stored.km],['weekSessionsTarget',stored.sessions]])$(id).value=v;
 function saveTargets(){const km=Number($('weekKmTarget').value),sessions=Number($('weekSessionsTarget').value);if(!Number.isFinite(km)||km<1||km>250||!Number.isInteger(sessions)||sessions<1||sessions>14)return;write(weekKey,{km,sessions,manual:true});updateWeek();window.coachV47?.save()}
 $('weekKmTarget').addEventListener('change',saveTargets);$('weekSessionsTarget').addEventListener('change',saveTargets);
 const storedFeeling=read(feelingKey,{});const today=new Date().toLocaleDateString('en-CA');
 $('dailyFeeling').value=storedFeeling.date===today?storedFeeling.value||'':'';
 $('dailyFeeling').addEventListener('change',()=>{write(feelingKey,{date:today,value:$('dailyFeeling').value});updateReadiness()});
 const avgLast=(rows,endDays,startDays=0)=>{const now=new Date(),start=new Date(now);start.setDate(start.getDate()-endDays+1);start.setHours(0,0,0,0);const upper=new Date(now);upper.setDate(upper.getDate()-startDays);upper.setHours(23,59,59,999);const values=rows.filter(x=>{const d=new Date(x.date+'T12:00:00');return d>=start&&d<=upper&&Number.isFinite(x.value)}).map(x=>x.value);return values.length>=4?values.reduce((a,b)=>a+b,0)/values.length:null};
 async function updateReadiness(){const [bb,sl,hr]=await Promise.all(['body-battery','sleep','hrv'].map(k=>dbOp('readonly','get',k)));const streams=[{name:'Body Battery',rows:batterySeries(bb?.data).map(x=>({date:x.date,value:x.last})),delta:10,relative:false},{name:'sommeil',rows:sleepSeries(sl?.data),delta:.5,relative:false},{name:'VFC',rows:hrvSeries(hr?.data),delta:.10,relative:true}];const signals=[];let compared=0;for(const s of streams){const recent=avgLast(s.rows,7),prior=avgLast(s.rows,14,7);if(recent===null||prior===null||!prior)continue;compared++;if((s.relative?recent/prior<1-s.delta:recent<prior-s.delta))signals.push(s.name)}const f=$('dailyFeeling').value;let title='À compléter',msg='Renseigne ton ressenti. Les tendances Garmin sont analysées seulement si au moins 4 jours sont disponibles dans chaque période.';if(f==='tired'){title='Fatigue ressentie';msg='Privilégie une séance facile ou du repos selon tes sensations.'}else if(f){title=signals.length>=2?'Vigilance':signals.length===1?'À surveiller':'Tendance habituelle';msg=compared?`${compared} indicateur(s) comparables ; ${signals.length?signals.join(', ')+' en recul':'aucun recul marqué détecté'}. ${f==='good'?'Ressenti positif.':'Ressenti habituel.'}`:'Historique Garmin insuffisant pour comparer les semaines. Écoute tes sensations.'} $('dailyReadiness').textContent=title;$('dailyReadinessDetail').textContent=msg}
 async function updateWeek(){const strava=await readStravaCache();const now=new Date(),monday=new Date(now);monday.setHours(0,0,0,0);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);const end=new Date(monday);end.setDate(end.getDate()+7);const activities=(strava?.activities||[]).filter(a=>a.sport==='Course à pied').filter(a=>{const dt=new Date(a.date);return dt>=monday&&dt<end&&dt<=now});const km=activities.reduce((sum,a)=>sum+(Number(a.distance_km)||0),0);const targetKm=Number($('weekKmTarget').value)||40,planned=Number($('weekSessionsTarget').value)||4,progress=Math.min(100,Math.round(km/targetKm*100));$('weekKm').textContent=strava?.activities?focusNumber(km,1):'—';$('weekSummary').textContent=strava?.activities?`${activities.length} séance(s) réalisées · ${Math.max(0,planned-activities.length)} restante(s) sur ${planned} prévues`:'Synchronise Strava pour afficher les séances.';$('weekRemaining').textContent=strava?.activities?`${focusNumber(Math.max(0,targetKm-km),1)} km restant(s) vers ${targetKm} km ciblés`:'Synchronise Strava pour comparer le plan au réalisé';$('weekProgressFill').style.width=(strava?.activities?progress:0)+'%';$('weekProgress').setAttribute('aria-valuenow',String(strava?.activities?progress:0))}
 window.addEventListener('luteo-coach-v47-loaded',()=>{prefs=read(prefKey,{order:ids,hidden:[]});apply();const w=read(weekKey,{km:40,sessions:4});$('weekKmTarget').value=w.km;$('weekSessionsTarget').value=w.sessions;updateWeek().catch(console.warn)});
 async function refresh(){await Promise.all([updateWeek(),updateReadiness()])}
 if($('lastSync'))new MutationObserver(()=>refresh().catch(console.warn)).observe($('lastSync'),{childList:true,subtree:true,characterData:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh().catch(console.warn)});
 refresh().catch(console.warn);
})();


/* V4.7 — pont Cloudflare Access, sans fetch cross-origin des données privées. */
(function(){
 const CLOUD='https://luteo-garmin-cloud.luteo-strava-api.workers.dev';let bridge=null,objectives=[];const $=id=>document.getElementById(id);
 const prefKey='luteo-coach-v46-cards',weekKey='luteo-coach-v46-week';
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
 const status=t=>{if($('coachCloudStatus'))$('coachCloudStatus').textContent=t};
 function save(){if(!bridge?.ready)return;bridge.popup.postMessage({source:'luteo-coach-v47',nonce:bridge.nonce,action:'save',preferences:{...read(prefKey),week:read(weekKey)}},new URL(CLOUD).origin)}
 window.coachV47={save};
 function applyPlan(){const today=new Date().toISOString().slice(0,10);const active=objectives.filter(x=>!x.deletedAt&&x.payload?.date>=today).sort((a,b)=>a.payload.date.localeCompare(b.payload.date))[0];
  if(!active){status('Préférences synchronisées · aucun objectif futur trouvé.');return}
  const goal=active.payload,days=(new Date(goal.date+'T12:00:00Z')-new Date(today+'T12:00:00Z'))/86400000;
  const factor=days<7?.4:days<14?.65:days<21?.8:1;const target=Math.round(Number(goal.weeklyKm||0)*factor*10)/10;
  const label=$('weekPlanInfo');if(label)label.textContent=`${goal.name} · ${goal.date} · cible planifiée ${target} km/semaine${factor<1?' (affûtage)':''}`;
  const current=read(weekKey);if(target>0&&(!current||!current.manual)){
   const next={km:target,sessions:current?.sessions||4,manual:false};localStorage.setItem(weekKey,JSON.stringify(next));window.dispatchEvent(new Event('luteo-coach-v47-loaded'));save();
  }
  if($('focusGoal'))$('focusGoal').textContent=goal.name;
 }
 $('coachCloudConnect')?.addEventListener('click',()=>{const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');const popup=window.open(CLOUD+'/coach-bridge#nonce='+nonce,'luteoCoachCloud','width=680,height=680');if(!popup){status('Autorise les fenêtres contextuelles pour te connecter.');return}bridge={nonce,popup,ready:false};status('Connexion Cloudflare Access en cours…')});
 window.addEventListener('message',event=>{if(!bridge||event.origin!==new URL(CLOUD).origin||event.source!==bridge.popup)return;const m=event.data;if(m?.source!=='luteo-coach-v47'||m.nonce!==bridge.nonce)return;
  if(m.type==='error'){status('Synchronisation indisponible : '+String(m.message||'erreur'));return}
  if(m.type==='initial'){
   bridge.ready=true;objectives=Array.isArray(m.objectives)?m.objectives:[];
   if(m.preferences){localStorage.setItem(prefKey,JSON.stringify({order:m.preferences.order,hidden:m.preferences.hidden}));localStorage.setItem(weekKey,JSON.stringify({...m.preferences.week,manual:true}));window.dispatchEvent(new Event('luteo-coach-v47-loaded'))}
   applyPlan();status('Objectifs et préférences chargés depuis Cloudflare.');
  }
  if(m.type==='saved')status('Préférences enregistrées dans ton espace sécurisé.');
 });
})();
