// Ouvre les onglets historiques de RUN // DATA depuis des liens directs.
(function(){
  const params=new URLSearchParams(location.search);
  const tab=params.get('tab');
  if(!tab)return;
  const btn=document.querySelector('.tab[data-tab="'+CSS.escape(tab)+'"]');
  if(!btn)return;
  const activate=()=>{if(!btn.classList.contains('active'))btn.click();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(activate,120));
  else setTimeout(activate,120);
})();
