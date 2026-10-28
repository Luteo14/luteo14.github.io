const {test,expect}=require('@playwright/test');
const today=()=>new Date().toISOString().slice(0,10);

async function seedStrava(page,activities){
  await page.goto('/sport/');
  await page.evaluate(async (activities)=>{
    await new Promise((resolve,reject)=>{
      const q=indexedDB.open('luteo14-sport',1);
      q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('cache'))q.result.createObjectStore('cache')};
      q.onerror=()=>reject(q.error);
      q.onsuccess=()=>{const db=q.result,tx=db.transaction('cache','readwrite');tx.objectStore('cache').put({activities,saved_at:new Date().toISOString()},'strava');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};
    });
  },activities);
}

test('kilométrage et rapprochement Strava sur la même date',async({page})=>{
  const date=today();
  await seedStrava(page,[{id:101,date,sport:'Course à pied',distance_km:10.2,duration_s:3300}]);
  await page.goto('/sport/coach/plan/');
  await page.locator('#date').fill(date);
  await page.locator('#title').fill('Endurance QA');
  await page.locator('#km').fill('10');
  await page.locator('#sessionForm button[type="submit"]').click();
  await expect(page.locator('#actual')).toContainText('10,2 km');
  await expect(page.locator('#matched')).toContainText('1 / 1');
  await expect(page.locator('#calendar')).toContainText('Rapprochement possible');
});

test('une activité Strava ne doit pas rapprocher deux séances',async({page})=>{
  const date=today();
  await seedStrava(page,[{id:102,date,sport:'Course à pied',distance_km:8,duration_s:2600}]);
  await page.goto('/sport/coach/plan/');
  for(const title of ['Footing A','Footing B']){
    await page.locator('#date').fill(date);
    await page.locator('#title').fill(title);
    await page.locator('#km').fill('8');
    await page.locator('#sessionForm button[type="submit"]').click();
  }
  await expect(page.locator('#matched')).toContainText('1 / 2');
});

test('une séance sans activité correspondante reste non rapprochée',async({page})=>{
  await seedStrava(page,[]);
  await page.goto('/sport/coach/plan/');
  await page.locator('#date').fill(today());
  await page.locator('#title').fill('Sortie test');
  await page.locator('#km').fill('9');
  await page.locator('#sessionForm button[type="submit"]').click();
  await expect(page.locator('#matched')).toContainText('0 / 1');
});

// Test négatif du vrai parseur GPX V4.9, sans appel externe.
test('GPX mal formé rejeté sans export',async({page})=>{
  await page.goto('/sport/coach/plan/');
  await page.locator('#date').fill(today());
  await page.locator('#title').fill('Sortie GPX');
  await page.locator('#km').fill('8');
  await page.locator('#sessionForm button[type="submit"]').click();
  await page.locator('#gpxSession').selectOption({index:1});
  await page.locator('#gpxRoute').setInputFiles({name:'broken.gpx',mimeType:'application/gpx+xml',buffer:Buffer.from('<gpx><trk>')});
  await page.locator('#exportGpx').click();
  await expect(page.locator('#gpxStatus')).toContainText(/invalide|erreur/i);
});
