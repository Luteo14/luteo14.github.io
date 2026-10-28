(()=>{'use strict';
async function renderVersion(){
  try{
    const response=await fetch('/version.json',{cache:'no-store'});
    if(!response.ok)throw Error('Version indisponible');
    const data=await response.json();
    if(!/^\d+\.\d+\.\d+$/.test(String(data.version||'')))return;
    let target=document.querySelector('[data-luteo-version]');
    if(!target){target=document.createElement('div');target.setAttribute('data-luteo-version','');target.setAttribute('aria-label','Version de LUTEO14');target.style.cssText='padding:16px 20px;text-align:center;font:12px/1.5 system-ui,sans-serif;color:inherit;opacity:.65';document.body.appendChild(target)}
    target.textContent='LUTEO14 · Version '+data.version+(data.build&&data.build!=='local'?' · '+data.build:'');
  }catch(e){console.warn('LUTEO14 : version indisponible');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderVersion,{once:true});else renderVersion();
})();
