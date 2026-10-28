const {test,expect}=require('@playwright/test');
const today=()=>new Date().toLocaleDateString('en-CA');

// Diagnostic non sensible : erreurs JS, erreurs console et ressources manquantes.
test.beforeEach(async ({page},testInfo)=>{
  page.on('pageerror',error=>console.error(`[${testInfo.project.name}] ERREUR JAVASCRIPT:`,error.message));
  page.on('console',message=>{if(message.type()==='error')console.error(`[${testInfo.project.name}] ERREUR CONSOLE:`,message.text())});
  page.on('response',response=>{if(response.status()>=400 && new URL(response.url()).origin===new URL(page.url()||'http://127.0.0.1').origin)console.error(`[${testInfo.project.name}] HTTP ${response.status()}:`,new URL(response.url()).pathname)});
});

async function diagnosticCalendrier(page,label){
  const info=await page.evaluate(()=>({
    url:location.pathname,readyState:document.readyState,
    planScript:[...document.scripts].map(s=>s.src).find(s=>s.includes('plan.js'))||null,
    actual:document.getElementById('actual')?.textContent,
    matched:document.getElementById('matched')?.textContent,
    weekLabel:document.getElementById('weekLabel')?.textContent,
    calendarDays:document.getElementById('calendar')?.children.length,
    selectedDate:document.getElementById('date')?.value
  }));
  console.log(`DIAGNOSTIC CALENDRIER (${label}):`,JSON.stringify(info));
}

async function ouvrirCalendrier(page,label){
  await page.goto('/sport/coach/plan/');
  await diagnosticCalendrier(page,label+' - apres navigation');
  await expect(page.locator('#weekLabel')).not.toBeEmpty({timeout:12000});
  await expect(page.locator('#matched')).not.toHaveText('—',{timeout:12000});
}


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
  await ouvrirCalendrier(page,'test');
  await page.locator('#date').fill(date);
  await page.locator('#title').fill('Endurance QA');
  await page.locator('#km').fill('10');
  await page.locator('#sessionForm button[type="submit"]').click();
  await diagnosticCalendrier(page,'apres ajout seance');
  await expect(page.locator('#actual')).toContainText('10,2 km');
  await expect(page.locator('#matched')).toContainText('1 / 1');
  await expect(page.locator('#calendar')).toContainText('Rapprochement possible');
});

test('une activité Strava ne doit pas rapprocher deux séances',async({page})=>{
  const date=today();
  await seedStrava(page,[{id:102,date,sport:'Course à pied',distance_km:8,duration_s:2600}]);
  await ouvrirCalendrier(page,'test');
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
  await ouvrirCalendrier(page,'test');
  await page.locator('#date').fill(today());
  await page.locator('#title').fill('Sortie test');
  await page.locator('#km').fill('9');
  await page.locator('#sessionForm button[type="submit"]').click();
  await expect(page.locator('#matched')).toContainText('0 / 1');
});

// Test négatif du vrai parseur GPX V4.9, sans appel externe.
test('GPX mal formé rejeté sans export',async({page})=>{
  await ouvrirCalendrier(page,'test');
  await page.locator('#date').fill(today());
  await page.locator('#title').fill('Sortie GPX');
  await page.locator('#km').fill('8');
  await page.locator('#sessionForm button[type="submit"]').click();
  await page.locator('#gpxSession').selectOption({index:1});
  await page.locator('#gpxRoute').setInputFiles({name:'broken.gpx',mimeType:'application/gpx+xml',buffer:Buffer.from('<gpx><trk>')});
  await page.locator('#exportGpx').click();
  await expect(page.locator('#gpxStatus')).toContainText(/invalide|erreur/i);
});
