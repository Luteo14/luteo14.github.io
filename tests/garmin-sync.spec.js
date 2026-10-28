const {test,expect}=require('@playwright/test');
const CLOUD='https://luteo-garmin-cloud.luteo-strava-api.workers.dev';
async function fakeBridge(page){
 await page.addInitScript(()=>{
   window.__bridgeUrl=null;
   window.open=(url)=>{window.__bridgeUrl=url;return window};
 });
 await page.goto('/sport/coach/');
 await expect(page.locator('#garminCloudSync')).toBeVisible();
 await page.locator('#garminCloudSync').click();
}
async function dispatch(page,type,payload){
 await page.evaluate(({type,payload,CLOUD})=>{
  const nonce=new URL(window.__bridgeUrl).hash.match(/nonce=([a-f0-9]{32})/)[1];
  window.dispatchEvent(new MessageEvent('message',{
   origin:new URL(CLOUD).origin,source:window,
   data:{source:'luteo-garmin-v39',nonce,type,...(payload?{payload}:{})}
  }));
 },{type,payload,CLOUD});
}
async function cache(page){return page.evaluate(async()=>{
 const db=await new Promise((ok,fail)=>{const r=indexedDB.open('luteo14-garmin-v38',1);r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error)});
 const values=await Promise.all(['sleep','body-battery','hrv'].map(k=>new Promise((ok,fail)=>{const r=db.transaction('exports','readonly').objectStore('exports').get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error)})));
 db.close();return values;
})}
const snapshot={updated_at:'2026-10-28T14:21:29.953Z',sleep:[{calendarDate:'2026-10-28',sleepTimeSeconds:24840}],hrv:[{calendarDate:'2026-10-28',hrvSummary:{lastNightAvg:54}}], 'body-battery':[{date:'2026-10-28',charged:51,drained:47,bodyBatteryValuesArray:[]}]};
test('Garmin : transfert authentifié remplace un cache ancien et actualise les cartes',async({page})=>{
 await fakeBridge(page);
 // Reproduit le cache réel obsolète du 26 octobre.
 await page.evaluate(async()=>{
  const db=await new Promise((ok,fail)=>{const r=indexedDB.open('luteo14-garmin-v38',1);r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error)});
  await new Promise((ok,fail)=>{const tx=db.transaction('exports','readwrite');for(const k of ['sleep','body-battery','hrv'])tx.objectStore('exports').put({data:[],importedAt:'2026-10-26T17:14:35.460Z'},k);tx.oncomplete=ok;tx.onerror=()=>fail(tx.error)});db.close();
 });
 await dispatch(page,'snapshot',snapshot);
 await expect(page.locator('#garminCloudStatus')).toContainText('3 catégories Garmin actualisées');
 await expect(page.locator('#sleep')).toContainText('6.9');
 await expect(page.locator('#hrv')).toContainText('54');
 const rows=await cache(page);
 expect(rows).toHaveLength(3);
 expect(rows.every(x=>x.cloudUpdatedAt===snapshot.updated_at)).toBeTruthy();
 await expect(page.locator('#garminFreshness')).toContainText('28/10/2026');
});
test('Garmin : snapshot incomplet refusé sans altérer le cache',async({page})=>{
 await fakeBridge(page);
 await dispatch(page,'snapshot',snapshot);
 await expect(page.locator('#garminCloudStatus')).toContainText('3 catégories Garmin actualisées');
 const before=await cache(page);
 await dispatch(page,'snapshot',{updated_at:'2026-10-29T12:00:00Z',sleep:[],hrv:[]});
 await expect(page.locator('#garminCloudStatus')).toContainText('Snapshot incomplet');
 expect((await cache(page)).map(x=>x.cloudUpdatedAt)).toEqual(before.map(x=>x.cloudUpdatedAt));
});
test('Garmin : erreur d’authentification explicite',async({page})=>{
 await fakeBridge(page);
 await page.evaluate(CLOUD=>{
  const nonce=new URL(window.__bridgeUrl).hash.match(/nonce=([a-f0-9]{32})/)[1];
  window.dispatchEvent(new MessageEvent('message',{origin:new URL(CLOUD).origin,source:window,data:{source:'luteo-garmin-v39',nonce,type:'error',message:'Session Access expirée'}}));
 },CLOUD);
 await expect(page.locator('#garminCloudStatus')).toContainText('Session Access expirée');
});
