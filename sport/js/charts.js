/* LUTEO14 shared chart rules — V4.4 */
(()=>{
 const palette={pink:'#f34d91',blue:'#74c9f8',violet:'#9b7bf5',muted:'#c5d3e8',grid:'rgba(180,199,231,.16)',card:'#101c32'};
 function config(type,labels,datasets,opts={}){
  const line=type==='line',donut=type==='doughnut';
  const mapped=datasets.map((d,i)=>({
   ...d,
   ...(line?{tension:.28,pointRadius:labels.length>18?2:4,pointHoverRadius:6,borderWidth:2.5,spanGaps:false,fill:false}:{}),
   ...(!line&&!donut?{borderRadius:6,maxBarThickness:44}:{}),
  }));
  return {type,data:{labels,datasets:mapped},options:{responsive:true,maintainAspectRatio:false,animation:{duration:280},interaction:{mode:'index',intersect:false},
   plugins:{legend:{display:opts.legend??(datasets.length>1||donut),labels:{color:palette.muted,boxWidth:11,usePointStyle:true}},tooltip:{backgroundColor:palette.card,titleColor:'#fff',bodyColor:'#e6edf8',padding:12,displayColors:true}},
   scales:donut?{}:{x:{grid:{display:false},ticks:{color:palette.muted,maxRotation:0,autoSkip:true,maxTicksLimit:opts.xTicks||10}},y:{beginAtZero:opts.beginAtZero??!line,suggestedMin:opts.yMin,suggestedMax:opts.yMax,min:opts.hardMin,max:opts.hardMax,grid:{color:palette.grid},ticks:{color:palette.muted,maxTicksLimit:6,callback:opts.yTick}}}}
  };
 }
 window.LuteoCharts={palette,config};
})();
