const fmt=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1});let DATA=[],charts={};const C={accent:'#f34d91',muted:'#b9c3dd',grid:'#465587',green:'#74c9f8'};
const sum=(a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0);const dur=s=>{let h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h?`${h}h ${String(m).padStart(2,'0')}`:`${m} min`};const pace=a=>a.distance_km>0&&a.sport==='Course à pied'?`${Math.floor(a.duration_s/60/a.distance_km)}:${String(Math.round((a.duration_s/60/a.distance_km%1)*60)).padStart(2,'0')}/km`:'—';
function chart(id,type,labels,datasets){if(charts[id])charts[id].destroy();charts[id]=new Chart(document.getElementById(id),{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:C.muted,boxWidth:10}}},scales:type==='doughnut'?{}:{x:{ticks:{color:C.muted},grid:{display:false}},y:{ticks:{color:C.muted},grid:{color:C.grid},beginAtZero:true}}}})}
function render(){const y=document.getElementById('yearFilter').value;let d=y==='all'?DATA:DATA.filter(x=>new Date(x.date).getFullYear()==y);const runs=d.filter(x=>x.sport==='Course à pied');const km=sum(runs,x=>x.distance_km),secs=sum(runs,x=>x.duration_s),elev=sum(runs,x=>x.elevation_m);const weeks=new Set(runs.map(x=>{let z=new Date(x.date),jan=new Date(z.getFullYear(),0,1);return `${z.getFullYear()}-${Math.ceil((((z-jan)/86400000)+jan.getDay()+1)/7)}`}));document.getElementById('kpis').innerHTML=[['Distance',`${fmt.format(km)} km`],['Séances',runs.length],['Temps',dur(secs)],['Dénivelé',`${fmt.format(elev)} m`],['Moy. / sortie',`${fmt.format(runs.length?km/runs.length:0)} km`],['Moy. / sem.',`${fmt.format(weeks.size?km/weeks.size:0)} km`]].map(([l,v])=>`<div class="kpi"><div class="v">${v}</div><div class="l">${l}</div></div>`).join('');
let months=Array(12).fill(0);runs.forEach(x=>months[new Date(x.date).getMonth()]+=x.distance_km);chart('monthlyChart','bar',['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'],[{label:'Course à pied',data:months,backgroundColor:C.accent,borderRadius:4}]);
let sports={};d.forEach(x=>sports[x.sport]=(sports[x.sport]||0)+x.duration_s/3600);chart('sportChart','doughnut',Object.keys(sports),[{data:Object.values(sports),backgroundColor:['#f34d91','#74c9f8','#3468f5','#f9b7d0','#8455d8'],borderWidth:0}]);
let years=[...new Set(DATA.map(x=>new Date(x.date).getFullYear()))].sort();let annual=years.map(Y=>sum(DATA.filter(x=>x.sport==='Course à pied'&&new Date(x.date).getFullYear()===Y),x=>x.distance_km));chart('annualChart','line',years,[{label:'km course',data:annual,borderColor:C.accent,backgroundColor:C.accent,tension:.25,pointRadius:4}]);let ae=years.map(Y=>sum(DATA.filter(x=>x.sport==='Course à pied'&&new Date(x.date).getFullYear()===Y),x=>x.elevation_m));chart('elevChart','bar',years,[{label:'D+ course',data:ae,backgroundColor:C.green,borderRadius:4}]);let as=years.map(Y=>DATA.filter(x=>x.sport==='Course à pied'&&new Date(x.date).getFullYear()===Y).length);chart('sessionsChart','bar',years,[{label:'séances course',data:as,backgroundColor:'#3468f5',borderRadius:4}]);
let now=new Date(Math.max(...DATA.map(x=>new Date(x.date))));let wlabels=[],wdata=[];for(let i=11;i>=0;i--){let end=new Date(now);end.setDate(end.getDate()-7*i);let start=new Date(end);start.setDate(start.getDate()-6);wlabels.push(`${start.getDate()}/${start.getMonth()+1}`);wdata.push(sum(runs.filter(x=>{let z=new Date(x.date);return z>=start&&z<=end}),x=>x.distance_km))}chart('weeklyChart','line',wlabels,[{label:'km / semaine',data:wdata,borderColor:C.green,backgroundColor:C.green,tension:.25}]);
let recent=[...d].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20);document.getElementById('activityCount').textContent=`${d.length} activités`;document.getElementById('activitiesTable').innerHTML=recent.map(a=>`<tr><td>${new Date(a.date).toLocaleDateString('fr-FR')}</td><td><span class="pill">${a.sport}</span></td><td>${fmt.format(a.distance_km)} km</td><td>${dur(a.duration_s)}</td><td>${fmt.format(a.elevation_m)} m</td><td>${pace(a)}</td></tr>`).join('')}
fetch('/sport/data/activities.json').then(r=>r.json()).then(async d=>{DATA=d;LOCAL_DATA=[...d];try{const saved=await loadStoredActivities();if(saved?.activities?.length){DATA=mergeActivities(d,saved.activities);updateStorageBadge(saved.saved_at,DATA.length)}}catch(e){console.warn('Stockage local indisponible',e)}const years=[...new Set(DATA.map(x=>new Date(x.date).getFullYear()))].sort((a,b)=>b-a);const s=document.getElementById('yearFilter');s.innerHTML='<option value="all">Toutes</option>'+years.map(y=>`<option value="${y}" ${y===years[0]?'selected':''}>${y}</option>`).join('');s.onchange=render;render()}).catch(e=>document.querySelector('main').innerHTML='<div class="card"><h2>Impossible de charger les données</h2><p>Lancez le site via GitHub Pages ou un serveur HTTP local.</p></div>');
// --- Navigation & plan d'entraînement ---
const DAY_NAMES=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const iso=d=>d.toISOString().slice(0,10);
function switchTab(name) {

    // Activation du bon bouton
    document.querySelectorAll('.tab').forEach(b => {
        b.classList.toggle(
            'active',
            b.dataset.tab === name
        );
    });

    // Masquer toutes les vues
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });

    // Association onglet → vue
    const views = {
        dashboard: 'dashboardView',
        training: 'trainingView',
        performance: 'performanceView',
        strava: 'stravaView'
    };

    const viewId = views[name];

    if (viewId) {
        document
            .getElementById(viewId)
            ?.classList.add('active');
    }

    // Filtre année uniquement sur Dashboard
    const dashboardControl =
        document.querySelector('.dashboard-control');

    if (dashboardControl) {
        dashboardControl.style.visibility =
            name === 'dashboard'
                ? 'visible'
                : 'hidden';
    }

    // Initialisation plan
    if (name === 'training') {
        initTraining();
    }
    if (name === 'performance') {
        initPerformance();
    }
}

document.querySelectorAll('.tab').forEach(b => {
    b.addEventListener('click', () => {
        switchTab(b.dataset.tab);
    });
});

function runData(){return DATA.filter(x=>x.sport==='Course à pied').sort((a,b)=>a.date.localeCompare(b.date));}
function trainingStats(){const r=runData();if(!r.length)return {avg4:0,sessions4:0,longest:0,elev4:0,last:null};const last=new Date(r[r.length-1].date),start=new Date(last);start.setDate(start.getDate()-27);const recent=r.filter(x=>new Date(x.date)>=start);const byWeek={};recent.forEach(x=>{const z=new Date(x.date);const monday=new Date(z);monday.setDate(z.getDate()-((z.getDay()+6)%7));const k=iso(monday);byWeek[k]=(byWeek[k]||0)+x.distance_km});const weekly=Object.values(byWeek);return {avg4:weekly.length?sum(weekly,x=>x)/4:0,sessions4:recent.length/4,longest:Math.max(0,...recent.map(x=>x.distance_km)),elev4:sum(recent,x=>x.elevation_m),last};}
function initTraining(){if(!DATA.length)return;const s=trainingStats();const input=document.getElementById('startKm');if(!input.value)input.value=Math.max(15,Math.round(s.avg4));const rd=document.getElementById('raceDate');if(!rd.value){const d=new Date();d.setDate(d.getDate()+84);rd.value=iso(d)}document.getElementById('trainingSnapshot').textContent=`Base récente : ${fmt.format(s.avg4)} km/sem · ${fmt.format(s.sessions4)} séances/sem`;
document.getElementById('profileMetrics').innerHTML=[['Volume 4 sem.',`${fmt.format(s.avg4)} km/sem`],['Fréquence',`${fmt.format(s.sessions4)} /sem`],['Sortie longue max',`${fmt.format(s.longest)} km`],['D+ sur 4 sem.',`${fmt.format(s.elev4)} m`]].map(([l,v])=>`<div class="metric"><strong>${v}</strong><span>${l}</span></div>`).join('');document.getElementById('coachNote').innerHTML=s.avg4?`Le générateur démarre autour de <strong>${Math.round(s.avg4)} km/semaine</strong>. La progression est plafonnée et une semaine d'allègement est intégrée régulièrement.`:'Pas assez de données de course récentes : renseigne manuellement ton volume de départ.';}
function parseTime(t){if(!t)return null;const p=t.split(':').map(Number);if(p.some(isNaN))return null;if(p.length===3)return p[0]*3600+p[1]*60+p[2];if(p.length===2)return p[0]*60+p[1];return null;}
function paceFromTarget(goal,t){const dist={"10k":10,half:21.097,marathon:42.195}[goal];if(!dist||!t)return null;return t/60/dist;}
function fmtPace(m){if(!m)return 'selon sensations';let mm=Math.floor(m),ss=Math.round((m-mm)*60);if(ss===60){mm++;ss=0}return `${mm}:${String(ss).padStart(2,'0')}/km`;}
function sessionDays(n,longDay){let base=n===3?[2,4,longDay]:n===4?[2,4,6,longDay]:n===5?[1,3,5,6,longDay]:[1,2,4,5,6,longDay];return [...new Set(base)].slice(0,n).sort((a,b)=>a-b)}
function buildWeek(i,total,km,n,goal,targetPace,longDay){const recovery=(i>0&&i%4===3), taper=i>=total-2;let factor=recovery?.82:1;if(taper)factor=i===total-1?.55:.72;const wk=Math.max(12,Math.round(km*factor));const longShare=(goal==='marathon'||goal==='trail'||goal==='backyard') ? .32 : .26;const longKm=Math.min(goal==='marathon'?32:goal==='half'?22:goal==='10k'?16:goal==='trail'?34:36,Math.max(8,Math.round(wk*longShare)));const days=sessionDays(n,+longDay);const qDay=days.length>2?days[1]:days[0];const remaining=Math.max(0,wk-longKm);const easyEach=Math.round(remaining/Math.max(1,days.length-1));return {wk,longKm,recovery,taper,sessions:days.map((day,j)=>{if(day===+longDay)return {day,type:'long',title:`Sortie longue · ${longKm} km`,desc:goal==='trail'||goal==='backyard'?'Endurance facile, terrain vallonné si disponible. Marche active autorisée dans les côtes.':'Endurance facile. Termine relâché ; pas de test chrono.'};if(day===qDay&&!recovery&&!taper){let desc=goal==='10k'?'Échauffement + 5 × 5 min soutenues, récup. 2 min + retour au calme.':goal==='half'?'Échauffement + 3 × 10 min au seuil, récup. 3 min + retour au calme.':goal==='marathon'?`Échauffement + 2 × 20 min proche allure marathon${targetPace?' ('+fmtPace(targetPace)+')':''}, récup. 5 min.`:'Côtes : 6 × 3 min en effort contrôlé, récupération en descente.';return {day,type:'quality',title:'Séance qualité',desc};}return {day,type:'easy',title:`Endurance · ~${easyEach} km`,desc:'Allure conversationnelle, effort facile. Réduis si fatigue inhabituelle.'};})};}
function generatePlan(e){e.preventDefault();const goal=document.getElementById('goalType').value,race=new Date(document.getElementById('raceDate').value+'T12:00:00'),today=new Date(),n=+document.getElementById('sessionsWeek').value,start=+document.getElementById('startKm').value,longDay=document.getElementById('longDay').value,target=parseTime(document.getElementById('targetTime').value),tp=paceFromTarget(goal,target);const days=Math.ceil((race-today)/86400000);if(days<7){alert("Choisis une date d'objectif située à au moins une semaine.");return}const total=Math.min(24,Math.max(2,Math.ceil(days/7))),maxGrowth=1.07;let km=start,weeks=[];for(let i=0;i<total;i++){if(i>0&&i%4!==3&&i<total-2)km=Math.min(km*maxGrowth,start*1.45);weeks.push(buildWeek(i,total,km,n,goal,tp,longDay));}
const goalName={"10k":'10 km',half:'Semi-marathon',marathon:'Marathon',trail:'Trail',backyard:'Backyard / Ultra'}[goal];document.getElementById('planSummary').innerHTML=[['Objectif',goalName],['Durée',`${total} semaines`],['Départ',`${Math.round(start)} km/sem`],['Pic',`${Math.max(...weeks.map(w=>w.wk))} km/sem`]].map(([l,v])=>`<div class="summary-box"><strong>${v}</strong><span>${l}</span></div>`).join('');document.getElementById('planWeeksLabel').textContent=`${total} semaines`;
const startDate=new Date(today);startDate.setDate(today.getDate()+((8-today.getDay())%7));document.getElementById('weeksContainer').innerHTML=weeks.map((w,i)=>{const ws=new Date(startDate);ws.setDate(ws.getDate()+7*i);const label=w.taper?'Affûtage':w.recovery?'Allègement':'Construction';return `<div class="week ${i===0?'current':''}"><div class="week-head"><h3>Semaine ${i+1} · ${label}</h3><div class="week-meta">${ws.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} · ${w.wk} km</div></div><div class="week-body">${w.sessions.map(s=>`<div class="session ${s.type}"><div class="day">${DAY_NAMES[s.day]}</div><strong>${s.title}</strong><p>${s.desc}</p></div>`).join('')}</div></div>`}).join('');document.getElementById('planResults').classList.remove('hidden');localStorage.setItem('runDataPlan',JSON.stringify({goal,date:document.getElementById('raceDate').value,target:document.getElementById('targetTime').value,n,start,longDay}));document.getElementById('planResults').scrollIntoView({behavior:'smooth'});}
document.getElementById('planForm').addEventListener('submit',generatePlan);
window.addEventListener('load',()=>{try{const p=JSON.parse(localStorage.getItem('runDataPlan'));if(p){document.getElementById('goalType').value=p.goal;document.getElementById('raceDate').value=p.date;document.getElementById('targetTime').value=p.target||'';document.getElementById('sessionsWeek').value=p.n;document.getElementById('startKm').value=p.start;document.getElementById('longDay').value=p.longDay;}}catch(e){}});

// --- Performance (V1.3) ---
const RACE_DISTANCES=[{key:'5k',label:'5 km',km:5},{key:'10k',label:'10 km',km:10},{key:'half',label:'Semi',km:21.0975},{key:'marathon',label:'Marathon',km:42.195}];
const fmtTime=s=>{if(!Number.isFinite(s)||s<=0)return '—';s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return h?`${h}h ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`:`${m}:${String(sec).padStart(2,'0')}`};
const paceTextFromSeconds=(sec,km)=>{if(!km||!sec)return '—';const p=sec/60/km,mm=Math.floor(p),ss=Math.round((p-mm)*60);return `${mm}:${String(ss===60?0:ss).padStart(2,'0')}/km`};
const riegel=(timeSec,d1,d2,exp=1.06)=>timeSec*Math.pow(d2/d1,exp);
function performanceRuns(){return DATA.filter(a=>a.sport==='Course à pied'&&a.distance_km>=3&&a.duration_s>0).filter(a=>{const p=a.duration_s/60/a.distance_km;return p>=3&&p<=9})}
function activityUrl(a){return a.strava_url||(a.id?`https://www.strava.com/activities/${a.id}`:null)}
function distanceRecord(target){const candidates=performanceRuns().filter(a=>a.distance_km>=target*.95&&a.distance_km<=target*1.15);if(!candidates.length)return null;return candidates.map(a=>({...a,estimated_time:a.duration_s*(target/a.distance_km)})).sort((a,b)=>a.estimated_time-b.estimated_time)[0]}
function recentReference(){const runs=performanceRuns();if(!runs.length)return null;const latest=Math.max(...runs.map(a=>new Date(a.date).getTime()));const cutoff=latest-180*86400000;let pool=runs.filter(a=>new Date(a.date).getTime()>=cutoff&&a.distance_km>=5&&a.distance_km<=32);if(!pool.length)pool=runs.filter(a=>a.distance_km>=5&&a.distance_km<=32);if(!pool.length)return null;return pool.map(a=>({...a,eq10:riegel(a.duration_s,a.distance_km,10)})).sort((a,b)=>a.eq10-b.eq10)[0]}
function predictionConfidence(ref,target){const ratio=Math.max(ref.distance_km,target)/Math.min(ref.distance_km,target);if(ratio<=1.25)return 'Élevée';if(ratio<=2.2)return 'Moyenne';return 'Prudente'}
function annual10k(){const groups={};performanceRuns().filter(a=>a.distance_km>=5&&a.distance_km<=32).forEach(a=>{const y=new Date(a.date).getFullYear(),v=riegel(a.duration_s,a.distance_km,10);if(!groups[y]||v<groups[y])groups[y]=v});return Object.entries(groups).sort((a,b)=>+a[0]-+b[0])}
function initPerformance(){if(!DATA.length)return;const records=RACE_DISTANCES.map(d=>({...d,record:distanceRecord(d.km)}));document.getElementById('recordCards').innerHTML=records.map(d=>{const r=d.record,u=r?activityUrl(r):null;return `<article class="record-card"><div class="record-distance">${d.label}</div><div class="record-time">${r?fmtTime(r.estimated_time):'—'}</div><div class="record-meta">${r?`${paceTextFromSeconds(r.estimated_time,d.km)} · ${new Date(r.date).toLocaleDateString('fr-FR')}`:'Aucune activité comparable'}</div>${u?`<a class="strava-link" href="${u}" target="_blank" rel="noopener noreferrer">Voir l’activité sur Strava ↗</a>`:''}<div class="record-source">${r?'Estimation depuis '+fmt.format(r.distance_km)+' km':'Distance non disponible'}</div></article>`}).join('');
const ref=recentReference();if(!ref){document.getElementById('performanceSnapshot').textContent='Données insuffisantes';document.getElementById('predictionCards').innerHTML='<p class="form-note">Pas assez de courses exploitables pour calculer les projections.</p>';return}document.getElementById('performanceSnapshot').textContent=`Référence récente : ${fmt.format(ref.distance_km)} km · ${new Date(ref.date).toLocaleDateString('fr-FR')}`;
const preds=RACE_DISTANCES.map(d=>({...d,time:riegel(ref.duration_s,ref.distance_km,d.km),confidence:predictionConfidence(ref,d.km)}));document.getElementById('predictionCards').innerHTML=preds.map(p=>`<div class="prediction-row"><div><strong>${p.label}</strong><span>${p.confidence}</span></div><div class="prediction-value"><strong>${fmtTime(p.time)}</strong><span>${paceTextFromSeconds(p.time,p.km)}</span></div></div>`).join('');document.getElementById('predictionNote').textContent='Prévisions théoriques calculées avec le modèle de Riegel (exposant 1,06) à partir de la meilleure référence des 180 derniers jours. Elles ne constituent pas un chrono garanti.';
const refUrl=activityUrl(ref);document.getElementById('performanceReference').innerHTML=[['Référence',`${fmt.format(ref.distance_km)} km`],['Temps',fmtTime(ref.duration_s)],['Allure',paceTextFromSeconds(ref.duration_s,ref.distance_km)],['Équiv. 10 km',fmtTime(ref.eq10)]].map(([l,v])=>`<div class="metric"><strong>${v}</strong><span>${l}</span></div>`).join('');document.getElementById('performanceCoachNote').innerHTML=`Référence du ${new Date(ref.date).toLocaleDateString('fr-FR')}. ${refUrl?`<a class="strava-link inline" href="${refUrl}" target="_blank" rel="noopener noreferrer">Ouvrir sur Strava ↗</a>`:''}`;
const evo=annual10k();chart('performanceEvolutionChart','line',evo.map(x=>x[0]),[{label:'Équivalent 10 km (minutes)',data:evo.map(x=>x[1]/60),borderColor:C.accent,backgroundColor:C.accent,tension:.25,pointRadius:4}]);
const best=[...performanceRuns()].filter(a=>a.distance_km>=5).map(a=>({...a,eq10:riegel(a.duration_s,a.distance_km,10)})).sort((a,b)=>a.eq10-b.eq10).slice(0,12);document.getElementById('performanceTable').innerHTML=best.map(a=>{const u=activityUrl(a);return `<tr><td>${new Date(a.date).toLocaleDateString('fr-FR')}</td><td>${fmt.format(a.distance_km)} km</td><td>${fmtTime(a.duration_s)}</td><td>${paceTextFromSeconds(a.duration_s,a.distance_km)}</td><td>${fmtTime(a.eq10)}</td><td>${u?`<a class="strava-link" href="${u}" target="_blank" rel="noopener noreferrer">Strava ↗</a>`:'—'}</td></tr>`}).join('')}

// --- Connexion Strava API (V1.2) ---
const API_BASE=(window.RUN_DATA_CONFIG?.API_BASE||'').replace(/\/$/,'');
let LOCAL_DATA=[];
function apiReady(){return API_BASE && !API_BASE.includes('REMPLACE-MOI')}
function setStravaButtons(connected){document.getElementById('connectStrava')?.classList.toggle('hidden',connected);document.getElementById('syncStrava')?.classList.toggle('hidden',!connected);document.getElementById('disconnectStrava')?.classList.toggle('hidden',!connected)}
let stravaBridge=null;
function launchStravaBridge(){
 if(!apiReady()){document.getElementById('stravaMessage').textContent='Worker Strava non configuré';return}
 const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
 const popup=window.open(API_BASE+'/bridge#nonce='+nonce,'luteoStravaSecure','width=660,height=750');
 if(!popup){document.getElementById('stravaMessage').textContent='Autorise les fenêtres contextuelles pour ce site, puis réessaie.';return}
 stravaBridge={popup,nonce};document.getElementById('stravaMessage').textContent='Connexion sécurisée ouverte : poursuis dans la nouvelle fenêtre.';
}
async function refreshStravaStatus(){
 if(!document.getElementById('stravaStatus'))return;
 document.getElementById('stravaStatus').textContent='Session sécurisée';
 document.getElementById('stravaMessage').textContent='Pour consulter ou synchroniser Strava, ouvre la fenêtre sécurisée. Le Dashboard conserve les activités déjà synchronisées.';
 setStravaButtons(true);
 document.getElementById('connectStrava').classList.remove('hidden');
}
function connectStrava(){launchStravaBridge()}
function syncStrava(){launchStravaBridge()}
function disconnectStrava(){launchStravaBridge();document.getElementById('stravaMessage').textContent='Dans la fenêtre sécurisée, utilise « Déconnecter et supprimer ».'}
window.addEventListener('message',async event=>{
 if(!stravaBridge||event.origin!==new URL(API_BASE).origin||event.source!==stravaBridge.popup)return;
 const d=event.data;if(!d||d.source!=='luteo-strava-bridge-v341'||d.nonce!==stravaBridge.nonce)return;
 const message=document.getElementById('stravaMessage');
 if(d.type==='disconnected'){try{await clearStoredActivities()}catch(e){console.warn(e)}DATA=[...LOCAL_DATA];refreshYears();render();updateStorageBadge(null,DATA.length);document.getElementById('stravaStatus').textContent='○ Strava non connecté';message.textContent=d.result?.revoked?'Données supprimées et autorisation Strava révoquée.':'Données supprimées ; révocation Strava à vérifier.';stravaBridge=null;return}
 if(d.type==='error'){message.textContent='Synchronisation : '+String(d.message||'Erreur');return}
 if(d.type==='status'){document.getElementById('stravaStatus').textContent=d.status?.connected?'● Strava connecté':'○ Strava non connecté';return}
 if(d.type==='activities'&&Array.isArray(d.payload?.activities)){
   const payload=d.payload;DATA=mergeActivities(LOCAL_DATA.length?LOCAL_DATA:DATA,payload.activities);
   try{await storeActivities(payload.activities,payload.last_sync)}catch(e){console.warn('IndexedDB :',e)}
   refreshYears();render();updateStorageBadge(payload.last_sync,DATA.length);
   message.textContent=`${payload.activities.length} activités synchronisées ; ${DATA.length} activités disponibles.`;
   if(document.getElementById('performanceView')?.classList.contains('active'))initPerformance();
   document.getElementById('stravaStatus').textContent='● Strava connecté';
   stravaBridge=null;
 }
});
document.getElementById('connectStrava')?.addEventListener('click',connectStrava);document.getElementById('syncStrava')?.addEventListener('click',syncStrava);document.getElementById('disconnectStrava')?.addEventListener('click',disconnectStrava);
const _switchTab=switchTab;switchTab=function(name){_switchTab(name);if(name==='strava')refreshStravaStatus();if(name==='performance')initPerformance()};
const params=new URLSearchParams(location.search);if(params.get('strava')==='connected'){history.replaceState({},'',location.pathname);setTimeout(()=>switchTab('strava'),300)}

// V3.3 — cache navigateur persistant (IndexedDB), source de secours : export CSV.
function openSportDb(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(Error('IndexedDB indisponible'));const r=indexedDB.open('luteo14-sport',1);r.onupgradeneeded=()=>r.result.createObjectStore('cache');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function cacheOp(mode,fn){const db=await openSportDb();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('cache',mode),store=tx.objectStore('cache'),r=fn(store);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}finally{db.close()}}
function loadStoredActivities(){return cacheOp('readonly',s=>s.get('strava'))}
function storeActivities(activities,saved_at){return cacheOp('readwrite',s=>s.put({activities,saved_at:saved_at||new Date().toISOString()},'strava'))}
function clearStoredActivities(){return cacheOp('readwrite',s=>s.delete('strava'))}
function mergeActivities(fallback,live){const m=new Map();for(const a of fallback||[]){const key=a.id?`id:${a.id}`:`csv:${a.date}:${a.sport}:${a.distance_km}`;m.set(key,a)}for(const a of live||[]){const key=a.id?`id:${a.id}`:`csv:${a.date}:${a.sport}:${a.distance_km}`;m.set(key,a)}return [...m.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date)))}
function refreshYears(){const s=document.getElementById('yearFilter');if(!s)return;const selected=s.value,years=[...new Set(DATA.map(a=>new Date(a.date).getFullYear()).filter(Number.isFinite))].sort((a,b)=>b-a);s.innerHTML='<option value="all">Toutes</option>'+years.map(y=>`<option value="${y}">${y}</option>`).join('');s.value=years.some(y=>String(y)===selected)?selected:(years[0]?String(years[0]):'all')}
function updateStorageBadge(date,count){const el=document.getElementById('sportStorageStatus');if(el)el.textContent=`${count} activités disponibles · ${date?'Strava synchronisé le '+new Date(date).toLocaleString('fr-FR'):'export local'}`}
async function recalculateRecords(){
 const b=document.getElementById('recalculateRecords');if(!b)return;
 b.disabled=true;b.textContent='Recalcul en cours…';
 try{
   // Les activites sont deja en memoire / IndexedDB. Aucun fetch cross-origin
   // vers une route Cloudflare Access depuis GitHub Pages.
   const saved=await loadStoredActivities().catch(()=>null);
   if(saved?.activities?.length){DATA=mergeActivities(LOCAL_DATA.length?LOCAL_DATA:DATA,saved.activities);updateStorageBadge(saved.saved_at,DATA.length)}
   refreshYears();render();initPerformance();
   const el=document.getElementById('recordsRecalculatedAt');
   if(el)el.textContent='Records recalcules le '+new Date().toLocaleString('fr-FR')+' sur les donnees disponibles. Pour actualiser Strava, utilise « Synchroniser maintenant ».';
 }catch(e){const el=document.getElementById('recordsRecalculatedAt');if(el)el.textContent='Echec du recalcul : '+e.message}
 finally{b.disabled=false;b.textContent='↻ Recalculer les records estimés'}
}
document.getElementById('recalculateRecords')?.addEventListener('click',recalculateRecords);

// LUTEO14 V3.5 - Synthese entrainement, source locale et tendance.
// Aucun appel direct vers les routes protegees Cloudflare Access.
(function(){
  const css=document.createElement('style');
  css.textContent=`.v35-panel{margin:18px 0;padding:20px;border:1px solid #465587;border-radius:16px;background:#14213a;color:#f5f7ff}.v35-panel h2{margin:0 0 8px;font-size:1.2rem}.v35-sub{color:#b9c3dd;font-size:.9rem;margin-bottom:14px}.v35-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.v35-stat{background:#202f50;border-radius:12px;padding:14px}.v35-stat strong{display:block;font-size:1.4rem;color:#f9a6cc}.v35-stat span{font-size:.85rem;color:#d0d9ef}.v35-note{font-size:.85rem;color:#d0d9ef;margin-top:12px;line-height:1.5}`;
  document.head.appendChild(css);
  function box(id,anchor,title){let e=document.getElementById(id);if(e)return e;const target=document.getElementById(anchor);if(!target)return null;e=document.createElement('section');e.id=id;e.className='v35-panel';e.setAttribute('aria-label',title);target.parentNode.insertBefore(e,target);return e}
  const safeNum=n=>Number.isFinite(n)?n:0;
  function stats(){
    const runs=DATA.filter(a=>a.sport==='Course à pied'&&Number.isFinite(+a.distance_km)&&!isNaN(Date.parse(a.date)));
    if(!runs.length)return null;
    const latest=Math.max(...runs.map(a=>Date.parse(a.date)));
    const inRange=(daysAgoStart,daysAgoEnd)=>runs.filter(a=>{const age=(latest-Date.parse(a.date))/86400000;return age>=daysAgoStart&&age<daysAgoEnd});
    const totalKm=items=>sum(items,a=>a.distance_km);
    const last7=inRange(0,7),prev7=inRange(7,14),last28=inRange(0,28),prev28=inRange(28,56);
    const current=totalKm(last28),previous=totalKm(prev28);
    const longest=Math.max(0,...last28.map(a=>+a.distance_km||0));
    return {latest,last7,prev7,last28,prev28,week:totalKm(last7),prevWeek:totalKm(prev7),month:current,prevMonth:previous,longest,sessions:last28.length,source:window.__v35Source||'Données disponibles'};
  }
  function metric(label,value){return `<div class="v35-stat"><strong>${value}</strong><span>${label}</span></div>`}
  function drawDashboard(){const e=box('v35Training','kpis','Pilotage de l’entraînement');if(!e)return;const s=stats();if(!s){e.innerHTML='<h2>Pilotage de l’entraînement</h2><p>Aucune activité de course disponible.</p>';return}
    const change=s.prevMonth>0?`${s.month>=s.prevMonth?'+':''}${Math.round((s.month/s.prevMonth-1)*100)} %`:'Non calculable';
    e.innerHTML=`<h2>Pilotage de l’entraînement</h2><div class="v35-sub">Référence : dernière activité du ${new Date(s.latest).toLocaleDateString('fr-FR')} · ${s.source}</div><div class="v35-grid">${metric('7 derniers jours',fmt.format(s.week)+' km')}${metric('7 jours précédents',fmt.format(s.prevWeek)+' km')}${metric('28 derniers jours',fmt.format(s.month)+' km')}${metric('Évolution 28 j / 28 j',change)}${metric('Séances sur 28 jours',s.sessions)}${metric('Plus longue sortie sur 28 jours',fmt.format(s.longest)+' km')}</div><div class="v35-note">Fenêtres glissantes calculées à partir de la date de la dernière activité, et non de la date du jour. Une variation de volume ne constitue pas à elle seule un diagnostic de fatigue ou de progression.</div>`;
  }
  function drawPerformance(){const e=box('v35Performance','recordCards','Lecture des performances');if(!e)return;const s=stats();e.innerHTML=`<h2>Comprendre mes performances</h2><div class="v35-sub">Records estimés et projections : deux notions distinctes</div><div class="v35-note">Les « records estimés » existants sont extrapolés à partir de sorties de distance voisine. Ce ne sont pas des meilleurs passages GPS certifiés. Les prévisions Riegel sont des projections mathématiques, pas des chronos garantis. ${s?'Volume des 28 derniers jours : '+fmt.format(s.month)+' km, sur '+s.sessions+' séances.':'Synchronise des activités pour afficher les indicateurs.'}</div>`}
  const previousRender=render;render=function(){previousRender();drawDashboard();if(document.getElementById('performanceView')?.classList.contains('active'))drawPerformance()};
  const previousPerformance=initPerformance;initPerformance=function(){previousPerformance();drawPerformance()};
  const previousBadge=updateStorageBadge;updateStorageBadge=function(date,count){window.__v35Source=date?'Cache Strava synchronisé le '+new Date(date).toLocaleString('fr-FR'):'Export historique / cache local';previousBadge(date,count);drawDashboard()};
})();


// LUTEO14 V3.6 - Mon Coach Running (analyse locale, explicable, sans API supplementaire).
(function(){
 const style=document.createElement('style');
 style.textContent=`.coach36{margin:18px 0;padding:22px;border:1px solid #596ba1;border-radius:18px;background:linear-gradient(145deg,#172744,#111b32);color:#f5f7ff}.coach36 h2{margin:0 0 8px;font-size:1.4rem}.coach36 p{line-height:1.55}.coach36 .muted{color:#b9c3dd;font-size:.9rem}.coach36-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:12px;margin:16px 0}.coach36-card{background:#243453;border-radius:12px;padding:14px}.coach36-card b{display:block;color:#ffa8d0;font-size:1.35rem}.coach36-card small{display:block;color:#cbd6ec;margin-top:5px}.coach36-tags{display:flex;gap:8px;flex-wrap:wrap}.coach36-tag{font-size:.75rem;border:1px solid #8495b8;border-radius:20px;padding:4px 9px;color:#dce5fa}.coach36-list{padding-left:20px;line-height:1.65}.coach36-list li{margin:8px 0}.coach36-alert{border-left:3px solid #f34d91;padding:9px 12px;background:#29314d;margin:14px 0}.coach36 details{margin-top:12px;color:#cbd6ec}.coach36 a{color:#ffa8d0}`;
 document.head.appendChild(style);
 const num=x=>Number(x)||0;
 const f=n=>Number.isFinite(n)?n.toLocaleString('fr-FR',{maximumFractionDigits:1}):'—';
 const dateMs=a=>Date.parse(a.date);
 function compute(){
  const runs=DATA.filter(a=>a.sport==='Course à pied'&&num(a.distance_km)>0&&num(a.duration_s)>0&&Number.isFinite(dateMs(a)));
  if(!runs.length)return null;
  const latest=Math.max(...runs.map(dateMs));
  const group=(lo,hi)=>runs.filter(a=>{const days=(latest-dateMs(a))/86400000;return days>=lo&&days<hi});
  const km=arr=>arr.reduce((s,a)=>s+num(a.distance_km),0);
  const w1=group(0,7),w2=group(7,14),w3=group(14,21),w4=group(21,28),prev=group(28,56);
  const four=[w4,w3,w2,w1].map(km),last28=[...w1,...w2,...w3,...w4],k28=km(last28),p28=km(prev);
  const long=Math.max(0,...last28.map(a=>num(a.distance_km)));
  const paceRuns=last28.filter(a=>a.distance_km>=3&&a.duration_s/a.distance_km>=180&&a.duration_s/a.distance_km<=900);
  const averagePace=paceRuns.length?paceRuns.reduce((s,a)=>s+num(a.duration_s),0)/km(paceRuns):null;
  const todayGap=(Date.now()-latest)/86400000;
  const trend=p28>0?(k28/p28-1)*100:null;
  const weeklyMean=k28/4;
  const longestShare=k28>0?long/k28:null;
  const recentRef=typeof recentReference==='function'?recentReference():null;
  return {runs,latest,todayGap,four,last28,k28,p28,trend,weeklyMean,long,longestShare,averagePace,recentRef};
 }
 function advice(s){const items=[];
  if(s.todayGap>10)items.push(['Données anciennes',`La dernière activité remonte à ${Math.floor(s.todayGap)} jours. Synchronise Strava avant de tirer des conclusions sur ta forme actuelle.`]);
  if(s.trend!==null&&s.trend>25)items.push(['Progression de volume rapide',`Le volume sur 28 jours a augmenté de ${Math.round(s.trend)} % par rapport aux 28 jours précédents. Prévois des journées faciles et vérifie ton niveau de récupération avant toute augmentation supplémentaire.`]);
  else if(s.trend!==null&&s.trend< -25)items.push(['Volume en diminution',`Le volume a diminué de ${Math.abs(Math.round(s.trend))} % sur 28 jours. Cela peut refléter un affûtage, une récupération ou une interruption : interprète-le selon ton objectif.`]);
  else if(s.trend!==null)items.push(['Volume relativement stable',`Variation de ${s.trend>=0?'+':''}${Math.round(s.trend)} % sur 28 jours. Continue à ajuster les séances à tes sensations et à ton calendrier.`]);
  if(s.longestShare!==null&&s.longestShare>.42&&s.k28>=15)items.push(['Sortie longue dominante',`La plus longue sortie représente ${Math.round(s.longestShare*100)} % du volume des 28 derniers jours. Vérifie l'équilibre entre sorties longues, footings faciles et récupération.`]);
  if(s.last28.length<6)items.push(['Historique limité',`Seulement ${s.last28.length} sorties sur 28 jours : les tendances sont fragiles. Évite de tirer des conclusions sur l'intensité ou la fatigue.`]);
  if(!items.length)items.push(['Continuité',`Poursuis une alternance de séances faciles, de qualité adaptée et de récupération, sans augmenter le volume uniquement pour améliorer un indicateur.`]);
  items.push(['Avant une compétition',`Réduis la charge selon ton calendrier de course. Les données disponibles ne suffisent pas à mesurer ta récupération physiologique ni à prescrire une séance intensive.`]);
  return items;
 }
 function draw(){const anchor=document.getElementById('kpis');if(!anchor)return;
  let box=document.getElementById('coachRunning36');if(!box){box=document.createElement('section');box.id='coachRunning36';box.className='coach36';anchor.parentNode.insertBefore(box,anchor)}
  const s=compute();if(!s){box.innerHTML='<h2>Mon Coach Running</h2><p>Synchronise tes activités Strava pour afficher les tendances et recommandations.</p>';return}
  const freshness=s.todayGap<=3?'Données récentes':s.todayGap<=10?'Données à actualiser':'Données anciennes';
  const trend=s.trend===null?'Non calculable':`${s.trend>=0?'+':''}${Math.round(s.trend)} %`;
  const ref=s.recentRef;
  const estimate=ref?riegel(ref.duration_s,ref.distance_km,42.195):null;
  const cards=[['Volume / 28 j',f(s.k28)+' km','Observé'],['Moyenne / semaine',f(s.weeklyMean)+' km','Calculé sur 28 jours'],['Séances / 28 j',String(s.last28.length),'Observé'],['Plus longue sortie',f(s.long)+' km','Observé'],['Évolution / 28 j',trend,'Comparaison calculée'],['Projection marathon',estimate?fmtTime(estimate):'—','Estimation Riegel, non garantie']];
  const rec=advice(s);
  box.innerHTML=`<div class="coach36-tags"><span class="coach36-tag">V3.6 · Mon Coach Running</span><span class="coach36-tag">${freshness}</span><span class="coach36-tag">Calcul local, sans nouvel accès API</span></div><h2>Mon Coach Running</h2><p class="muted">Dernière activité : ${new Date(s.latest).toLocaleDateString('fr-FR')} · Les indicateurs portent sur la course à pied et sont ancrés sur cette date.</p><div class="coach36-grid">${cards.map(([label,val,source])=>`<div class="coach36-card"><b>${val}</b><span>${label}</span><small>${source}</small></div>`).join('')}</div><h3>Mes 4 dernières semaines</h3><p class="muted">Volumes hebdomadaires glissants, de la plus ancienne à la plus récente : ${s.four.map(x=>f(x)+' km').join(' → ')}.</p><h3>Recommandations contextualisées</h3><ul class="coach36-list">${rec.map(([title,detail])=>`<li><strong>${title}.</strong> ${detail}</li>`).join('')}</ul><div class="coach36-alert"><strong>Mesuré ≠ estimé.</strong> Les distances, durées et séances proviennent des activités enregistrées. Les variations et moyennes sont calculées. La projection marathon est une extrapolation théorique à partir d'une activité de référence, pas un record ni une recommandation d'allure.</div><details><summary>Méthode et limites</summary><p>Analyse locale de DATA (export historique + activités Strava synchronisées). Comparaison des 28 derniers jours aux 28 jours précédents, selon la date de dernière activité. Aucun diagnostic médical, aucune mesure de charge physiologique, aucune déduction fiable des zones cardiaques : les données de fréquence cardiaque détaillées, de sommeil et de ressenti ne sont pas disponibles ici. Les recommandations sont des règles indicatives, à contextualiser selon la récupération et les compétitions.</p></details>`;
 }
 const oldRender=render;render=function(){oldRender();draw()};
 const oldBadge=updateStorageBadge;updateStorageBadge=function(date,count){oldBadge(date,count);draw()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(draw,150));else setTimeout(draw,150);
})();
