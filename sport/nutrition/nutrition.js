(()=>{'use strict';
const RACE='2026-11-08',KEY='luteo14-nutrition-2026-11-08-v2',OLD_KEY='luteo14-nutrition-2026-11-08-v1';
const CLOUD='https://luteo-garmin-cloud.luteo-strava-api.workers.dev',ORIGIN=new URL(CLOUD).origin;let cloudBridge=null,cloudVersion=null,dirty=false;
const $=id=>document.getElementById(id), MEALS=['Petit-déjeuner','Déjeuner','Dîner','Collation'];
const defaults={'Petit-déjeuner':['porridge','tartines','semoule'],'Déjeuner':['riz_poulet','pates_thon','pommes_poisson','pates_poulet'],'Dîner':['omelette_riz','pates_tomate','riz_poisson','soupe_pain'],'Collation':['collation','yaourt_biscuit']};
const dateFor=i=>{const d=new Date(state.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10)};
const countDays=()=>Math.round((Date.parse(state.endDate+'T12:00:00Z')-Date.parse(state.startDate+'T12:00:00Z'))/86400000)+1;
const validRange=(a,b)=>/^\d{4}-\d{2}-\d{2}$/.test(a)&&/^\d{4}-\d{2}-\d{2}$/.test(b)&&!Number.isNaN(Date.parse(a+'T12:00:00Z'))&&!Number.isNaN(Date.parse(b+'T12:00:00Z'))&&Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000)>=0&&Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000)<61;
const fmtDate=d=>new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const formatQty=(q,u)=>`${Number(q.toFixed(1)).toLocaleString('fr-FR',{maximumFractionDigits:1})} ${u}`;
let recipes=[],state={startDate:'2026-10-24',endDate:'2026-11-07',persons:2,choices:{},checked:{}};
function ensureChoices(){
  const days=countDays();for(let i=0;i<days;i++){const date=dateFor(i);if(!state.choices[date])state.choices[date]={};for(const m of MEALS){const id=state.choices[date][m];if(!recipes.some(r=>r.id===id&&r.category===m)){const pool=defaults[m];state.choices[date][m]=pool[(i+(m==='Dîner'?1:m==='Collation'?2:0))%pool.length]}}}
}
function initial(){return {startDate:'2026-10-24',endDate:'2026-11-07',persons:2,choices:{},checked:{}}}
function sanitize(input){const base=initial();if(input&&typeof input==='object'){
  if(validRange(input.startDate,input.endDate)){base.startDate=input.startDate;base.endDate=input.endDate}
  if(Number.isInteger(input.persons)&&input.persons>=1&&input.persons<=12)base.persons=input.persons;
  if(input.choices&&typeof input.choices==='object'){for(const [date,meals] of Object.entries(input.choices)){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!meals||typeof meals!=='object')continue;
    base.choices[date]={};for(const m of MEALS){const id=meals[m];if(recipes.some(r=>r.id===id&&r.category===m))base.choices[date][m]=id}
  }}
  if(input.checked&&typeof input.checked==='object'){for(const [key,value] of Object.entries(input.checked)){if(key.length<=160&&typeof value==='boolean')base.checked[key]=value}}
}return base}
function restore(){let saved=null;try{saved=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(OLD_KEY)||'null')}catch{}state=sanitize(saved);ensureChoices()}
function persist(){dirty=true;localStorage.setItem(KEY,JSON.stringify(state));$('saveState').textContent='Enregistré sur cet appareil · clique sur « Synchroniser sur mes appareils » pour partager.'}
function updatePeriod(){
  $('startDate').value=state.startDate;$('endDate').value=state.endDate;
  $('periodSummary').textContent=`${fmtDate(state.startDate)} → ${fmtDate(state.endDate)}`;
  $('periodTitle').textContent=`Mes repas du ${fmtDate(state.startDate)} au ${fmtDate(state.endDate)}`;
}
function refreshAll(){ensureChoices();updatePeriod();renderDays();renderShopping()}
function applyPeriod(){const a=$('startDate').value,b=$('endDate').value;if(!validRange(a,b)){$('saveState').textContent='Choisis une période valide de 1 à 61 jours.';updatePeriod();return}state.startDate=a;state.endDate=b;ensureChoices();persist();refreshAll()}
function openCloud(){
  const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
  const popup=window.open(CLOUD+'/nutrition-bridge#nonce='+nonce,'luteoNutritionCloud','width=680,height=650');
  if(!popup){$('saveState').textContent='Autorise les fenêtres contextuelles pour synchroniser.';return}
  cloudBridge={popup,nonce};$('saveState').textContent='Authentification Cloudflare en cours…';
}
window.addEventListener('message',async e=>{
  if(!cloudBridge||e.origin!==ORIGIN||e.source!==cloudBridge.popup)return;
  const m=e.data;if(m?.source!=='luteo-nutrition-v511'||m.nonce!==cloudBridge.nonce)return;
  if(m.type==='ready'){cloudBridge.popup.postMessage({source:'luteo-nutrition-v511',nonce:cloudBridge.nonce,action:'load'},ORIGIN);return}
  if(m.type==='error'){$('saveState').textContent='Cloudflare : '+String(m.message||'Erreur');return}
  if(m.type==='loaded'){
    cloudVersion=m.updatedAt||null;
    if(m.data){
      if(dirty){if(confirm('Des menus existent déjà dans Cloudflare. Remplacer ces menus par les modifications de cet appareil ?')){requestCloudSave()}else{$('saveState').textContent='Menus distants conservés. Recharge la page pour les récupérer.'}return}
      state=sanitize(m.data);refreshAll();localStorage.setItem(KEY,JSON.stringify(state));$('persons').value=state.persons;
      $('saveState').textContent='Menus chargés depuis Cloudflare · synchronisés sur cet appareil.';
    }else{
      cloudBridge.popup.postMessage({source:'luteo-nutrition-v511',nonce:cloudBridge.nonce,action:'save',data:state,expectedUpdatedAt:cloudVersion},ORIGIN);
    }
    return;
  }
  if(m.type==='saved'){cloudVersion=m.updatedAt;dirty=false;$('saveState').textContent='Menus et liste de courses synchronisés dans Cloudflare D1.'}
});
function requestCloudSave(){
  if(!cloudBridge||cloudBridge.popup.closed){openCloud();return}
  cloudBridge.popup.postMessage({source:'luteo-nutrition-v511',nonce:cloudBridge.nonce,action:'save',data:state,expectedUpdatedAt:cloudVersion},ORIGIN);
  $('saveState').textContent='Enregistrement Cloudflare en cours…';
}

function ingredients(recipe){return Object.entries(recipe.ingredients).map(([name,x])=>`${name} : ${formatQty(x.qty*state.persons,x.unit)}`)}
function renderDays(){const root=$('days');root.replaceChildren();for(let i=0;i<countDays();i++){const date=dateFor(i),d=document.createElement('article');d.className='day-card';const h=document.createElement('h3');h.textContent=fmtDate(date)+' · J-'+Math.max(0,Math.round((Date.parse(RACE+'T12:00:00Z')-Date.parse(date+'T12:00:00Z'))/86400000));d.append(h);const phase=document.createElement('p');phase.className='phase';phase.textContent=date>= '2026-11-06'&&date<RACE?'Approche de la course · privilégier les repas familiers et digestes':date>= '2026-11-01'&&date<RACE?'Affûtage · maintenir des apports suffisants':'Préparation · repas équilibrés et réguliers';d.append(phase);const grid=document.createElement('div');grid.className='meal-grid';for(const meal of MEALS){const box=document.createElement('div');box.className='meal';const label=document.createElement('label');const sel=document.createElement('select');const sid=`meal-${i}-${MEALS.indexOf(meal)}`;sel.id=sid;label.htmlFor=sid;label.textContent=meal;for(const r of recipes.filter(r=>r.category===meal))sel.add(new Option(r.name,r.id));sel.value=state.choices[date][meal];sel.addEventListener('change',()=>{state.choices[date][meal]=sel.value;persist();renderDays();renderShopping()});box.append(label,sel);const r=recipes.find(x=>x.id===sel.value);const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Recette et quantités';const desc=document.createElement('p');desc.textContent=r.instructions;const list=document.createElement('ul');for(const text of ingredients(r)){const li=document.createElement('li');li.textContent=text;list.append(li)}details.append(summary,desc,list);box.append(details);grid.append(box)}d.append(grid);root.append(d)}}
function aggregate(){const totals=new Map();for(let i=0;i<countDays();i++){const date=dateFor(i);for(const id of Object.values(state.choices[date])){const r=recipes.find(x=>x.id===id);if(!r)continue;for(const [name,item] of Object.entries(r.ingredients)){const key=name+'|'+item.unit;const existing=totals.get(key)||{name,unit:item.unit,qty:0};existing.qty+=item.qty*state.persons;totals.set(key,existing)}}}return [...totals.values()].sort((a,b)=>a.name.localeCompare(b.name,'fr'))}
function renderShopping(){const root=$('shopping');root.replaceChildren();for(const item of aggregate()){const key=item.name+'|'+item.unit;const row=document.createElement('label');row.className='shopping-item'+(state.checked[key]?' checked':'');const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!state.checked[key];cb.addEventListener('change',()=>{state.checked[key]=cb.checked;row.classList.toggle('checked',cb.checked);persist()});const span=document.createElement('span');span.textContent=item.name;const qty=document.createElement('strong');qty.textContent=formatQty(item.qty,item.unit);row.append(cb,span,qty);root.append(row)}}
function downloadCsv(){const lines=[['Ingrédient','Quantité','Unité','Acheté'],...aggregate().map(x=>[x.name,String(Number(x.qty.toFixed(1))),x.unit,state.checked[x.name+'|'+x.unit]?'oui':'non'])];const csv='\uFEFF'+lines.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='luteo14-courses-'+state.startDate+'-'+state.endDate+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function toggle(panel){$('mealsPanel').hidden=panel!=='meals';$('shoppingPanel').hidden=panel!=='shopping';$('showMeals').classList.toggle('active',panel==='meals');$('showShopping').classList.toggle('active',panel==='shopping')}
async function init(){
 try {
  const r=await fetch('./recipes.json');
  if(!r.ok)throw Error('HTTP '+r.status);
  recipes=await r.json();restore();$('persons').value=state.persons;refreshAll();$('startDate').addEventListener('change',applyPeriod);$('endDate').addEventListener('change',applyPeriod);$('cloudNutrition').addEventListener('click',requestCloudSave);
  $('persons').addEventListener('change',()=>{
   state.persons=Math.min(12,Math.max(1,Number($('persons').value)||2));
   $('persons').value=state.persons;persist();renderDays();renderShopping();
  });
  $('reset').onclick=()=>{
   if(!confirm('Réinitialiser les menus et la liste de courses ?'))return;
   state=initial();$('persons').value=2;persist();refreshAll();
  };
  $('showMeals').onclick=()=>toggle('meals');
  $('showShopping').onclick=()=>toggle('shopping');
  $('downloadCsv').onclick=downloadCsv;
  $('print').onclick=()=>window.print();
  $('copyList').onclick=async()=>{
   const txt=aggregate().map(x=>`${x.name} : ${formatQty(x.qty,x.unit)}`).join('\n');
   try{await navigator.clipboard.writeText(txt);$('saveState').textContent='Liste copiée.'}
   catch{$('saveState').textContent='Copie indisponible : utilise le CSV.'}
  };
 }catch(e){$('saveState').textContent='Impossible de charger les recettes : '+e.message}
}

init();
})();
