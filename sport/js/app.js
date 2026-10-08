const fmt=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1});let DATA=[],charts={};const C={accent:'#f34d91',muted:'#b9c3dd',grid:'#465587',green:'#74c9f8'};
const sum=(a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0);const dur=s=>{let h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h?`${h}h ${String(m).padStart(2,'0')}`:`${m} min`};const pace=a=>a.distance_km>0&&a.sport==='Course à pied'?`${Math.floor(a.duration_s/60/a.distance_km)}:${String(Math.round((a.duration_s/60/a.distance_km%1)*60)).padStart(2,'0')}/km`:'—';
function chart(id,type,labels,datasets){if(charts[id])charts[id].destroy();charts[id]=new Chart(document.getElementById(id),{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:C.muted,boxWidth:10}}},scales:type==='doughnut'?{}:{x:{ticks:{color:C.muted},grid:{display:false}},y:{ticks:{color:C.muted},grid:{color:C.grid},beginAtZero:true}}}})}
function render(){const y=document.getElementById('yearFilter').value;let d=y==='all'?DATA:DATA.filter(x=>new Date(x.date).getFullYear()==y);const runs=d.filter(x=>x.sport==='Course à pied');const km=sum(runs,x=>x.distance_km),secs=sum(runs,x=>x.duration_s),elev=sum(runs,x=>x.elevation_m);const weeks=new Set(runs.map(x=>{let z=new Date(x.date),jan=new Date(z.getFullYear(),0,1);return `${z.getFullYear()}-${Math.ceil((((z-jan)/86400000)+jan.getDay()+1)/7)}`}));document.getElementById('kpis').innerHTML=[['Distance',`${fmt.format(km)} km`],['Séances',runs.length],['Temps',dur(secs)],['Dénivelé',`${fmt.format(elev)} m`],['Moy. / sortie',`${fmt.format(runs.length?km/runs.length:0)} km`],['Moy. / sem.',`${fmt.format(weeks.size?km/weeks.size:0)} km`]].map(([l,v])=>`<div class="kpi"><div class="v">${v}</div><div class="l">${l}</div></div>`).join('');
let months=Array(12).fill(0);runs.forEach(x=>months[new Date(x.date).getMonth()]+=x.distance_km);chart('monthlyChart','bar',['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'],[{label:'Course à pied',data:months,backgroundColor:C.accent,borderRadius:4}]);
let sports={};d.forEach(x=>sports[x.sport]=(sports[x.sport]||0)+x.duration_s/3600);chart('sportChart','doughnut',Object.keys(sports),[{data:Object.values(sports),backgroundColor:['#f34d91','#74c9f8','#3468f5','#f9b7d0','#8455d8'],borderWidth:0}]);
let years=[...new Set(DATA.map(x=>new Date(x.date).getFullYear()))].sort();let annual=years.map(Y=>sum(DATA.filter(x=>x.sport==='Course à pied'&&new Date(x.date).getFullYear()===Y),x=>x.distance_km));chart('annualChart','line',years,[{label:'km course',data:annual,borderColor:C.accent,backgroundColor:C.accent,tension:.25,pointRadius:4}]);let ae=years.map(Y=>sum(DATA.filter(x=>x.sport==='Course à pied'&&new Date(x.date).getFullYear()===Y),x=>x.elevation_m));chart('elevChart','bar',years,[{label:'D+ course',data:ae,backgroundColor:C.green,borderRadius:4}]);let as=years.map(Y=>DATA.filter(x=>x.sport==='Course à pied'&&new Date(x.date).getFullYear()===Y).length);chart('sessionsChart','bar',years,[{label:'séances course',data:as,backgroundColor:'#3468f5',borderRadius:4}]);
let now=new Date(Math.max(...DATA.map(x=>new Date(x.date))));let wlabels=[],wdata=[];for(let i=11;i>=0;i--){let end=new Date(now);end.setDate(end.getDate()-7*i);let start=new Date(end);start.setDate(start.getDate()-6);wlabels.push(`${start.getDate()}/${start.getMonth()+1}`);wdata.push(sum(runs.filter(x=>{let z=new Date(x.date);return z>=start&&z<=end}),x=>x.distance_km))}chart('weeklyChart','line',wlabels,[{label:'km / semaine',data:wdata,borderColor:C.green,backgroundColor:C.green,tension:.25}]);
let recent=[...d].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20);document.getElementById('activityCount').textContent=`${d.length} activités`;document.getElementById('activitiesTable').innerHTML=recent.map(a=>`<tr><td>${new Date(a.date).toLocaleDateString('fr-FR')}</td><td><span class="pill">${a.sport}</span></td><td>${fmt.format(a.distance_km)} km</td><td>${dur(a.duration_s)}</td><td>${fmt.format(a.elevation_m)} m</td><td>${pace(a)}</td></tr>`).join('')}
fetch('data/activities.json').then(r=>r.json()).then(d=>{DATA=d;const years=[...new Set(d.map(x=>new Date(x.date).getFullYear()))].sort((a,b)=>b-a);const s=document.getElementById('yearFilter');s.innerHTML='<option value="all">Toutes</option>'+years.map(y=>`<option value="${y}" ${y===years[0]?'selected':''}>${y}</option>`).join('');s.onchange=render;render()}).catch(e=>document.querySelector('main').innerHTML='<div class="card"><h2>Impossible de charger les données</h2><p>Lancez le site via GitHub Pages ou un serveur HTTP local.</p></div>');
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
async function api(path,opts={}){const r=await fetch(API_BASE+path,{credentials:'include',...opts});if(!r.ok){let msg='Erreur API';try{msg=(await r.json()).error||msg}catch{}throw new Error(msg)}return r.status===204?null:r.json()}
function setStravaButtons(connected){document.getElementById('connectStrava')?.classList.toggle('hidden',connected);document.getElementById('syncStrava')?.classList.toggle('hidden',!connected);document.getElementById('disconnectStrava')?.classList.toggle('hidden',!connected)}
async function refreshStravaStatus(){if(!document.getElementById('stravaStatus'))return;if(!apiReady()){document.getElementById('stravaStatus').textContent='Backend à configurer';document.getElementById('stravaMessage').textContent="Déploie le Worker puis remplace API_BASE dans js/config.js.";setStravaButtons(false);return}try{const s=await api('/api/status');setStravaButtons(!!s.connected);document.getElementById('stravaStatus').textContent=s.connected?'● Strava connecté':'○ Non connecté';document.getElementById('stravaMetrics').innerHTML=[['Statut',s.connected?'Connecté':'Non connecté'],['Athlète',s.athlete_name||'—'],['Dernière synchro',s.last_sync?new Date(s.last_sync).toLocaleString('fr-FR'):'—'],['Cache',s.cached_activities!=null?`${s.cached_activities} activités`:'—']].map(([l,v])=>`<div class="metric"><strong>${v}</strong><span>${l}</span></div>`).join('');document.getElementById('stravaMessage').textContent=s.connected?'Tu peux synchroniser tes activités.':'Connecte ton compte pour charger tes activités privées.';}catch(e){document.getElementById('stravaStatus').textContent='API indisponible';document.getElementById('stravaMessage').textContent=e.message}}
async function syncStrava(){const b=document.getElementById('syncStrava');b.disabled=true;b.textContent='Synchronisation…';try{const payload=await api('/api/activities?sync=1');if(payload.activities?.length){LOCAL_DATA=LOCAL_DATA.length?LOCAL_DATA:[...DATA];DATA=payload.activities;const years=[...new Set(DATA.map(x=>new Date(x.date).getFullYear()))].sort((a,b)=>b-a),s=document.getElementById('yearFilter');s.innerHTML='<option value="all">Toutes</option>'+years.map((y,i)=>`<option value="${y}" ${i===0?'selected':''}>${y}</option>`).join('');render();document.getElementById('stravaMessage').textContent=`${DATA.length} activités chargées depuis Strava.`;}await refreshStravaStatus()}catch(e){document.getElementById('stravaMessage').textContent=e.message}finally{b.disabled=false;b.textContent='Synchroniser maintenant'}}
function connectStrava(){if(!apiReady()){refreshStravaStatus();return}window.location.href=API_BASE+'/auth/login'}
async function disconnectStrava(){if(!confirm('Révoquer l’accès Strava et supprimer les jetons du backend ?'))return;try{await api('/api/disconnect',{method:'POST'});if(LOCAL_DATA.length)DATA=LOCAL_DATA;render();await refreshStravaStatus()}catch(e){document.getElementById('stravaMessage').textContent=e.message}}
document.getElementById('connectStrava')?.addEventListener('click',connectStrava);document.getElementById('syncStrava')?.addEventListener('click',syncStrava);document.getElementById('disconnectStrava')?.addEventListener('click',disconnectStrava);
const _switchTab=switchTab;switchTab=function(name){_switchTab(name);if(name==='strava')refreshStravaStatus();if(name==='performance')initPerformance()};
const params=new URLSearchParams(location.search);if(params.get('strava')==='connected'){history.replaceState({},'',location.pathname);setTimeout(()=>{switchTab('strava');syncStrava()},300)}
