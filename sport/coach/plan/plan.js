(()=>{'use strict';const $=id=>document.getElementById(id),CLOUD='https://luteo-garmin-cloud.luteo-strava-api.workers.dev',ORIGIN=new URL(CLOUD).origin;let bridge=null,sessions=[],objectives=[],dirty=false,offset=0,activities=[];
const iso=d=>{const x=new Date(d);return Number.isFinite(x.getTime())?x.toISOString().slice(0,10):null};const today=()=>new Date().toLocaleDateString('en-CA');const weekStart=()=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7+offset*7);return d};const day=(base,i)=>{const d=new Date(base);d.setDate(d.getDate()+i);return iso(d)};
function send(action,extra={}){if(!bridge?.ready)return;bridge.popup.postMessage({source:'luteo-plan-v48',nonce:bridge.nonce,action,...extra},ORIGIN)}
$('connect').onclick=()=>{const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');const popup=window.open(CLOUD+'/training-bridge#nonce='+nonce,'luteoTraining','width=700,height=650');if(!popup){$('cloudState').textContent='Autorise les fenêtres contextuelles.';return}bridge={popup,nonce,ready:false};$('cloudState').textContent='Connexion Cloudflare Access…'};
window.addEventListener('message',e=>{if(!bridge||e.origin!==ORIGIN||e.source!==bridge.popup||e.data?.source!=='luteo-plan-v48'||e.data.nonce!==bridge.nonce)return;const m=e.data;if(m.type==='ready'){bridge.ready=true;send('load')}if(m.type==='loaded'){if(dirty&&!confirm('Remplacer les modifications non enregistrées par le plan Cloudflare ?'))return;sessions=Array.isArray(m.sessions)?m.sessions:[];objectives=(m.objectives||[]).filter(x=>!x.deletedAt).map(x=>x.payload||x);dirty=false;$('save').disabled=false;$('cloudState').textContent='Plan chargé depuis Cloudflare.';fillObjectives();render()}if(m.type==='saved'){dirty=false;$('cloudState').textContent='Plan enregistré dans Cloudflare D1.'}if(m.type==='error')$('cloudState').textContent='Erreur : '+m.message});
$('save').onclick=()=>{if(!bridge?.ready){$('cloudState').textContent='Connecte-toi à Cloudflare avant d’enregistrer.';return}send('save',{sessions})};$('previous').onclick=()=>{offset--;render()};$('next').onclick=()=>{offset++;render()};
function fillObjectives(){const el=$('objective');el.replaceChildren(new Option('Aucune',''));for(const o of objectives)el.add(new Option(o.name+' · '+o.date,o.id))}
function match(planned,used){const choices=activities.filter(a=>!used.has(a.id)&&a.date===planned.date&&Math.abs(a.km-planned.km)<=Math.max(2,planned.km*.35));choices.sort((a,b)=>Math.abs(a.km-planned.km)-Math.abs(b.km-planned.km));if(!choices.length)return null;used.add(choices[0].id);return choices[0]}
function render(){const start=weekStart(),dates=Array.from({length:7},(_,i)=>day(start,i)),rows=sessions.filter(s=>dates.includes(s.date)),used=new Set();$('weekLabel').textContent='Semaine du '+dates[0]+' au '+dates[6];$('planned').textContent=rows.reduce((a,s)=>a+s.km,0).toFixed(1)+' km';const actual=activities.filter(a=>dates.includes(a.date));$('actual').textContent=actual.length?actual.reduce((a,s)=>a+s.km,0).toFixed(1)+' km':'—';let matched=0;const cal=$('calendar');cal.replaceChildren();for(const date of dates){const box=document.createElement('article');box.className='plan-day';const h=document.createElement('h3');h.textContent=new Date(date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'short'});box.append(h);for(const s of rows.filter(x=>x.date===date)){const a=match(s,used);if(a)matched++;const b=document.createElement('div');b.className='plan-item '+(a?'done':'unmatched');b.tabIndex=0;b.setAttribute('role','button');const label=document.createElement('strong');label.textContent=s.title+' · '+s.km+' km';const note=document.createElement('small');note.textContent=a?'À confirmer · '+a.km.toFixed(1)+' km Strava'+(a.duration_s?' · '+Math.round(a.duration_s/60/a.km)+' min/km':''):'Prévu · sans rapprochement';b.append(label,note);if(a?.url){const link=document.createElement('a');link.href=a.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Voir sur Strava ↗';link.style.display='block';link.style.marginTop='6px';link.onclick=e=>e.stopPropagation();b.append(link)}b.onclick=()=>edit(s);b.onkeydown=e=>{if(e.key==='Enter')edit(s)};box.append(b)}cal.append(box)}$('matched').textContent=matched+' / '+rows.length;const future=objectives.filter(o=>o.date>=today()).sort((a,b)=>a.date.localeCompare(b.date))[0];$('goal').textContent=future?future.name:'Aucun objectif futur';updateRecovery(rows,actual)}
function edit(s){$('sid').value=s.id;$('date').value=s.date;$('title').value=s.title;$('type').value=s.type;$('km').value=s.km;$('objective').value=s.objectiveId||'';$('notes').value=s.notes||'';$('remove').hidden=false;$('sessionForm').scrollIntoView({behavior:'smooth'})}
$('sessionForm').onsubmit=e=>{e.preventDefault();const id=$('sid').value||crypto.randomUUID(),s={id,date:$('date').value,title:$('title').value.trim(),type:$('type').value,km:Number($('km').value),objectiveId:$('objective').value,notes:$('notes').value};if(!s.title||!s.date||!Number.isFinite(s.km)||s.km<0||s.km>100)return;sessions=sessions.filter(x=>x.id!==id).concat(s);dirty=true;$('cloudState').textContent='Modifications à enregistrer dans Cloudflare.';$('sessionForm').reset();$('sid').value='';$('remove').hidden=true;render()};$('remove').onclick=()=>{const id=$('sid').value;if(id&&confirm('Supprimer cette séance ?')){sessions=sessions.filter(s=>s.id!==id);dirty=true;$('sessionForm').reset();$('sid').value='';$('remove').hidden=true;render()}};
// V4.8.1 — Source Strava commune à RUN // DATA : luteo14-sport/cache/strava.
// Ne crée aucune base fictive et ne déclenche aucun appel API protégé.
function normalizeStravaActivity(a){
  if(!a||typeof a!=='object')return null;
  const sport=String(a.sport||a.sport_type||a.type||'');
  if(sport&&!(/course à pied|running|run|trail/i.test(sport)))return null;
  // RUN // DATA stocke date et distance_km ; les réponses Strava brutes utilisent distance en mètres.
  const rawDate=a.date||a.start_date_local||a.start_date;
  const date=typeof rawDate==='string'&&/^\d{4}-\d{2}-\d{2}/.test(rawDate)?rawDate.slice(0,10):iso(rawDate);
  const km=a.distance_km!==undefined&&a.distance_km!==null?Number(a.distance_km):Number(a.distance)/1000;
  if(!date||!Number.isFinite(km)||km<=0)return null;
  const duration=Number(a.duration_s??a.moving_time??a.elapsed_time);
  return {id:String(a.id||`${date}-${km}-${duration||0}`),date,km,
    duration_s:Number.isFinite(duration)&&duration>0?duration:null,
    url:a.strava_url||a.url||(a.id?`https://www.strava.com/activities/${encodeURIComponent(a.id)}`:null)};
}
async function loadStrava(){
  activities=[];
  try{
    const db=await new Promise((resolve,reject)=>{
      // Ne pas ouvrir la base en mode création : le Dashboard doit l'avoir initialisée.
      const req=indexedDB.open('luteo14-sport',1);
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
    try{
      if(!db.objectStoreNames.contains('cache'))throw Error('Cache RUN // DATA absent');
      const saved=await new Promise((resolve,reject)=>{
        const req=db.transaction('cache','readonly').objectStore('cache').get('strava');
        req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
      });
      const dedup=new Map();
      for(const item of saved?.activities||[]){const a=normalizeStravaActivity(item);if(a)dedup.set(a.id,a)}
      activities=[...dedup.values()].sort((a,b)=>a.date.localeCompare(b.date));
      console.info(`Plan LUTEO14 : ${activities.length} activités Strava lues depuis RUN // DATA.`);
    }finally{db.close()}
  }catch(e){console.info('Activités Strava indisponibles :',e.message)}
  render();
}
async function updateRecovery(rows,actual){try{const db=await new Promise((res,rej)=>{const r=indexedDB.open('luteo14-garmin-v38');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});const tx=db.transaction('exports','readonly');const get=k=>new Promise(res=>{const r=tx.objectStore('exports').get(k);r.onsuccess=()=>res(r.result?.data);r.onerror=()=>res(null)});const [sleep,hrv,battery]=await Promise.all(['sleep','hrv','body-battery'].map(get));db.close();const arr=x=>Array.isArray(x)?x:(x?[x]:[]),sleepDays=arr(sleep).filter(x=>x?.calendarDate||x?.date),hrvDays=arr(hrv).filter(x=>x?.hrvSummary?.lastNightAvg!=null),bbDays=arr(battery).filter(x=>x?.bodyBatteryValuesArray?.length);$('recovery').textContent=`Données disponibles : sommeil ${sleepDays.length} jour(s), VFC ${hrvDays.length} jour(s), Body Battery ${bbDays.length} jour(s).`;const recentSleep=sleepDays.slice(-3).map(x=>Number(x.dailySleepDTO?.sleepTimeSeconds??x.sleepTimeSeconds)/3600).filter(Number.isFinite);const avg=recentSleep.length?recentSleep.reduce((a,b)=>a+b,0)/recentSleep.length:null;let advice='Conserve les séances prévues si tes sensations sont habituelles ; ajuste-les selon ton ressenti.';if(avg!==null&&avg<6.5)advice='Sommeil moyen récent inférieur à 6 h 30 : envisage de réduire l’intensité et privilégie la récupération.';if(rows.some(x=>x.type==='interval'||x.type==='tempo')&&actual.length>=4)advice+=' Plusieurs séances réalisées cette semaine : évite de cumuler les efforts intenses sans récupération.';$('recommendations').textContent=advice}catch{$('recovery').textContent='Synchronise Garmin depuis Mes données pour enrichir cette analyse.';$('recommendations').textContent='Recommandations indisponibles sans données récentes.'}}
$('date').value=today();loadStrava();})();