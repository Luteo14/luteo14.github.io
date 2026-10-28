(()=>{'use strict';
const RACE='2026-11-08',COUNT=15,KEY='luteo14-nutrition-2026-11-08-v1';
const $=id=>document.getElementById(id), MEALS=['Petit-déjeuner','Déjeuner','Dîner','Collation'];
const defaults={'Petit-déjeuner':['porridge','tartines','semoule'],'Déjeuner':['riz_poulet','pates_thon','pommes_poisson','pates_poulet'],'Dîner':['omelette_riz','pates_tomate','riz_poisson','soupe_pain'],'Collation':['collation','yaourt_biscuit']};
const start=new Date('2026-10-24T12:00:00');const dateFor=i=>{const d=new Date(start);d.setDate(d.getDate()+i);return d.toISOString().slice(0,10)};
const fmtDate=d=>new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const formatQty=(q,u)=>`${Number(q.toFixed(1)).toLocaleString('fr-FR',{maximumFractionDigits:1})} ${u}`;
let recipes=[],state={persons:2,choices:{},checked:{}};
function initial(){const choices={};for(let i=0;i<COUNT;i++){const date=dateFor(i);choices[date]={};for(const m of MEALS){const pool=defaults[m];choices[date][m]=pool[(i+(m==='Dîner'?1:m==='Collation'?2:0))%pool.length]}}for(const i of [13,14]){const date=dateFor(i);choices[date]['Petit-déjeuner']='tartines';choices[date]['Déjeuner']='pates_poulet';choices[date]['Dîner']='riz_poisson';choices[date]['Collation']='collation'}return {persons:2,choices,checked:{}}}
function restore(){const base=initial();try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&typeof saved==='object'){base.persons=Number.isInteger(saved.persons)&&saved.persons>=1&&saved.persons<=12?saved.persons:2;for(const [date,meals] of Object.entries(base.choices)){for(const m of MEALS){const id=saved.choices?.[date]?.[m];if(recipes.some(r=>r.id===id&&r.category===m))meals[m]=id}}base.checked=saved.checked&&typeof saved.checked==='object'?saved.checked:{}}}catch{}state=base}
function persist(){localStorage.setItem(KEY,JSON.stringify(state));$('saveState').textContent='Modifications conservées sur cet appareil.'}
function ingredients(recipe){return Object.entries(recipe.ingredients).map(([name,x])=>`${name} : ${formatQty(x.qty*state.persons,x.unit)}`)}
function renderDays(){const root=$('days');root.replaceChildren();for(let i=0;i<COUNT;i++){const date=dateFor(i),d=document.createElement('article');d.className='day-card';const h=document.createElement('h3');h.textContent=fmtDate(date)+' · J-'+(15-i);d.append(h);const phase=document.createElement('p');phase.className='phase';phase.textContent=i>=13?'Approche de la course · privilégier les repas familiers et digestes':i>=9?'Affûtage · maintenir des apports suffisants':'Préparation · repas équilibrés et réguliers';d.append(phase);const grid=document.createElement('div');grid.className='meal-grid';for(const meal of MEALS){const box=document.createElement('div');box.className='meal';const label=document.createElement('label');const sel=document.createElement('select');const sid=`meal-${i}-${MEALS.indexOf(meal)}`;sel.id=sid;label.htmlFor=sid;label.textContent=meal;for(const r of recipes.filter(r=>r.category===meal))sel.add(new Option(r.name,r.id));sel.value=state.choices[date][meal];sel.addEventListener('change',()=>{state.choices[date][meal]=sel.value;persist();renderDays();renderShopping()});box.append(label,sel);const r=recipes.find(x=>x.id===sel.value);const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Recette et quantités';const desc=document.createElement('p');desc.textContent=r.instructions;const list=document.createElement('ul');for(const text of ingredients(r)){const li=document.createElement('li');li.textContent=text;list.append(li)}details.append(summary,desc,list);box.append(details);grid.append(box)}d.append(grid);root.append(d)}}
function aggregate(){const totals=new Map();for(const date of Object.keys(state.choices)){for(const id of Object.values(state.choices[date])){const r=recipes.find(x=>x.id===id);if(!r)continue;for(const [name,item] of Object.entries(r.ingredients)){const key=name+'|'+item.unit;const existing=totals.get(key)||{name,unit:item.unit,qty:0};existing.qty+=item.qty*state.persons;totals.set(key,existing)}}}return [...totals.values()].sort((a,b)=>a.name.localeCompare(b.name,'fr'))}
function renderShopping(){const root=$('shopping');root.replaceChildren();for(const item of aggregate()){const key=item.name+'|'+item.unit;const row=document.createElement('label');row.className='shopping-item'+(state.checked[key]?' checked':'');const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!state.checked[key];cb.addEventListener('change',()=>{state.checked[key]=cb.checked;row.classList.toggle('checked',cb.checked);persist()});const span=document.createElement('span');span.textContent=item.name;const qty=document.createElement('strong');qty.textContent=formatQty(item.qty,item.unit);row.append(cb,span,qty);root.append(row)}}
function downloadCsv(){const lines=[['Ingrédient','Quantité','Unité','Acheté'],...aggregate().map(x=>[x.name,String(Number(x.qty.toFixed(1))),x.unit,state.checked[x.name+'|'+x.unit]?'oui':'non'])];const csv='\uFEFF'+lines.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='luteo14-courses-marathon-2026.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function toggle(panel){$('mealsPanel').hidden=panel!=='meals';$('shoppingPanel').hidden=panel!=='shopping';$('showMeals').classList.toggle('active',panel==='meals');$('showShopping').classList.toggle('active',panel==='shopping')}
async function init(){
 try {
  const r=await fetch('./recipes.json');
  if(!r.ok)throw Error('HTTP '+r.status);
  recipes=await r.json();restore();$('persons').value=state.persons;renderDays();renderShopping();
  $('persons').addEventListener('change',()=>{
   state.persons=Math.min(12,Math.max(1,Number($('persons').value)||2));
   $('persons').value=state.persons;persist();renderDays();renderShopping();
  });
  $('reset').onclick=()=>{
   if(!confirm('Réinitialiser les menus et la liste de courses ?'))return;
   state=initial();$('persons').value=2;persist();renderDays();renderShopping();
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
