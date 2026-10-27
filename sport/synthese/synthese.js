(()=>{
'use strict';
const $=id=>document.getElementById(id), charts={};
function readDB(name,store,key){return new Promise(resolve=>{let r;try{r=indexedDB.open(name)}catch{return resolve(null)}r.onerror=()=>resolve(null);r.onsuccess=()=>{const db=r.result;if(!db.objectStoreNames.contains(store)){db.close();return resolve(null)}const q=db.transaction(store,'readonly').objectStore(store).get(key);q.onsuccess=()=>{db.close();resolve(q.result||null)};q.onerror=()=>{db.close();resolve(null)}}})}
const num=x=>Number.isFinite(Number(x))?Number(x):null;
const date=s=>typeof s==='string'?s.slice(0,10):null;
function chart(id,type,labels,datasets,opts={}){if(charts[id])charts[id].destroy();const el=$(id);if(!el||typeof Chart==='undefined'||!window.LuteoCharts)return;charts[id]=new Chart(el,window.LuteoCharts.config(type,labels,datasets,opts))}
function avg(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null}
function trendText(a,b){if(a==null||b==null||b===0)return 'Tendance non calculable';const p=(a/b-1)*100;return `${p>=0?'+':''}${Math.round(p)} % vs période précédente`}
function batterySeries(data){const rows=Array.isArray(data)?data:[];return rows.map(day=>{const pts=day?.bodyBatteryValuesArray||[];const v=pts.length?num(pts.at(-1)?.[1]):null;return {date:day?.date,value:v}}).filter(x=>x.date&&x.value!=null).sort((a,b)=>a.date.localeCompare(b.date))}
function dailyMetric(data,paths,transform=x=>x){const list=Array.isArray(data)?data:(data?[data]:[]);return list.map(x=>{let v=null;for(const p of paths){v=p.split('.').reduce((a,k)=>a?.[k],x);if(Number.isFinite(Number(v))){v=transform(Number(v));break}v=null}return {date:date(x.calendarDate||x.date),value:v}}).filter(x=>x.date&&x.value!=null).sort((a,b)=>a.date.localeCompare(b.date))}
Promise.all([
 readDB('luteo14-sport','cache','strava'),
 readDB('luteo14-garmin-v38','exports','body-battery'),
 readDB('luteo14-garmin-v38','exports','sleep'),
 readDB('luteo14-garmin-v38','exports','hrv')
]).then(([strava,battery,sleep,hrv])=>{
 const acts=strava?.activities||[], runs=acts.filter(a=>a.sport==='Course à pied'&&date(a.date));
 const latest=[...runs].sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
 if(runs.length){$('trainingKpi').textContent=runs.length+' sorties';$('trainingNote').textContent=latest?'Dernière sortie · '+new Date(latest.date).toLocaleDateString('fr-FR'):'Activités disponibles'} else $('trainingNote').textContent='Synchronise Strava dans Mes données.';
 const b=batterySeries(battery?.data);
 const s=dailyMetric(sleep?.data,['dailySleepDTO.sleepTimeSeconds','sleepTimeSeconds','sleepDurationInSeconds','totalSleepSeconds','sleepSeconds'],v=>v/3600);
 const h=dailyMetric(hrv?.data,['hrvSummary.lastNightAvg','hrvSummary.weeklyAvg','lastNightAvg','weeklyAvg','hrvValue']);
 const last=b.at(-1);
 if(last){$('recoveryKpi').textContent=Math.round(last.value)+' / 100';$('recoveryNote').textContent='Body Battery · '+new Date(last.date+'T12:00:00').toLocaleDateString('fr-FR')} else $('recoveryNote').textContent='Synchronise Garmin dans Mes données.';
 const end=[...runs.map(x=>date(x.date)),...b.map(x=>x.date),...s.map(x=>x.date),...h.map(x=>x.date)].sort().at(-1);
 if(end){
  const endD=new Date(end+'T12:00:00Z'),start=new Date(endD); start.setUTCDate(start.getUTCDate()-27);
  const prevStart=new Date(start); prevStart.setUTCDate(prevStart.getUTCDate()-28);
  const prevEnd=new Date(start); prevEnd.setUTCDate(prevEnd.getUTCDate()-1);
  const within=(d,a,z)=>{const x=new Date(d+'T12:00:00Z');return x>=a&&x<=z};
  const kmCur=runs.filter(x=>within(date(x.date),start,endD)).reduce((t,x)=>t+(Number(x.distance_km)||0),0);
  const kmPrev=runs.filter(x=>within(date(x.date),prevStart,prevEnd)).reduce((t,x)=>t+(Number(x.distance_km)||0),0);
  $('km28').textContent=kmCur.toFixed(1)+' km'; $('kmTrend').textContent=trendText(kmCur,kmPrev);
  const metric=(rows,idA,idT,unit,digits=0)=>{const cur=rows.filter(x=>within(x.date,start,endD)).map(x=>x.value),prev=rows.filter(x=>within(x.date,prevStart,prevEnd)).map(x=>x.value),a=avg(cur),p=avg(prev);$(idA).textContent=a==null?'—':a.toFixed(digits)+' '+unit;$(idT).textContent=trendText(a,p)};
  metric(s,'sleepAvg','sleepTrend','h',1); metric(h,'hrvAvg','hrvTrend','ms',0); metric(b,'bbAvg','bbTrend','/100',0);
  const weeks=[]; for(let i=3;i>=0;i--){const we=new Date(endD);we.setUTCDate(we.getUTCDate()-i*7);const ws=new Date(we);ws.setUTCDate(ws.getUTCDate()-6);weeks.push({label:`${ws.getUTCDate()}/${ws.getUTCMonth()+1}`,value:runs.filter(x=>within(date(x.date),ws,we)).reduce((t,x)=>t+(Number(x.distance_km)||0),0)})}
  chart('trainingChart','bar',weeks.map(x=>x.label),[{label:'km',data:weeks.map(x=>x.value),backgroundColor:'#f34d91'}],{beginAtZero:true});
  const last28=b.filter(x=>within(x.date,start,endD)); chart('recoveryChart','line',last28.map(x=>x.date.slice(5).replace('-','/')),[{label:'Body Battery',data:last28.map(x=>x.value),borderColor:'#74c9f8',backgroundColor:'#74c9f8'}],{hardMin:0,hardMax:100,beginAtZero:true});
 }
 try{const goals=JSON.parse(localStorage.getItem('luteo14-races-v37')||'[]');const today=new Date().toISOString().slice(0,10),g=goals.filter(x=>x.date>=today).sort((a,b)=>a.date.localeCompare(b.date))[0];if(g){$('goalKpi').textContent=g.name||'Compétition';$('goalNote').textContent=new Date(g.date+'T12:00:00').toLocaleDateString('fr-FR')+' · '+(g.distance||'')+' km'}}catch{}
});
})();
