/* LUTEO14 shared chart rules — V4.3 */
window.LuteoCharts={
 config(type,labels,datasets){
  const line=type==='line',donut=type==='doughnut';
  return {type,data:{labels,datasets:datasets.map(d=>({
   ...d, ...(line?{tension:.28,pointRadius:labels.length>18?2:4,pointHoverRadius:6,borderWidth:2.5,spanGaps:false}:{}),
   ...(!line&&!donut?{borderRadius:5,maxBarThickness:40}:{}),
  }))},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
   plugins:{legend:{display:datasets.length>1||donut,labels:{color:'#d5e0f2',boxWidth:11}},tooltip:{backgroundColor:'#101c32',titleColor:'#fff',bodyColor:'#e6edf8',padding:12}},
   scales:donut?{}:{x:{grid:{display:false},ticks:{color:'#c5d3e8',maxRotation:0,autoSkip:true,maxTicksLimit:10}},y:{beginAtZero:!line,grid:{color:'rgba(180,199,231,.16)'},ticks:{color:'#c5d3e8',maxTicksLimit:6}}}}
  };
 }
};
