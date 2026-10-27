// LUTEO14 V4.4: direct links to legacy views without a duplicate tab bar.
(function(){
 const params=new URLSearchParams(location.search);
 const tab=params.get('tab');
 const allowed=new Set(['dashboard','training','performance']);
 if(!allowed.has(tab))return;
 const activate=()=>{
  if(typeof window.switchTab==='function')window.switchTab(tab);
  else console.warn('Vue RUN // DATA indisponible :',tab);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(activate,120));
 else setTimeout(activate,120);
})();
