import {test,expect} from '@playwright/test';

test('Nutrition : 15 journées et menu commun',async({page})=>{
 await page.goto('/sport/nutrition/');
 await expect(page.locator('.day-card')).toHaveCount(15);
 await expect(page.locator('.day-card .meal select')).toHaveCount(60);
 await expect(page.locator('.luteo-nav a', {hasText:'Nutrition'})).toBeVisible();
});

test('Nutrition : quantités recalculées pour deux puis trois personnes',async({page})=>{
 await page.goto('/sport/nutrition/');
 await page.getByRole('button',{name:'Liste de courses'}).click();
 const before=await page.locator('#shopping').innerText();
 await page.locator('#persons').fill('3');
 await page.locator('#persons').dispatchEvent('change');
 const after=await page.locator('#shopping').innerText();
 expect(after).not.toBe(before);
});

test('Nutrition : modification conservée après rechargement',async({page})=>{
 await page.goto('/sport/nutrition/');
 const first=page.locator('.day-card .meal select').first();
 const options=await first.locator('option').evaluateAll(nodes=>nodes.map(n=>n.value));
 await first.selectOption(options[1]);
 await page.reload();
 await expect(page.locator('.day-card .meal select').first()).toHaveValue(options[1]);
});

test('Nutrition : export CSV de courses',async({page})=>{
 await page.goto('/sport/nutrition/');
 await page.getByRole('button',{name:'Liste de courses'}).click();
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Exporter en CSV'}).click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toMatch(/luteo14-courses-2026-10-24-2026-11-07\.csv$/);
});


test('Nutrition : période personnalisable et courses recalculées',async({page})=>{
 await page.goto('/sport/nutrition/');
 await expect(page.locator('.day-card')).toHaveCount(15);
 await page.locator('#startDate').fill('2026-10-27');
 await page.locator('#startDate').dispatchEvent('change');
 await page.locator('#endDate').fill('2026-10-30');
 await page.locator('#endDate').dispatchEvent('change');
 await expect(page.locator('.day-card')).toHaveCount(4);
 await expect(page.locator('.day-card .meal select')).toHaveCount(16);
 await page.getByRole('button',{name:'Liste de courses'}).click();
 await expect(page.locator('#shopping .shopping-item').first()).toBeVisible();
});

test('Nutrition : dates conservées après rechargement',async({page})=>{
 await page.goto('/sport/nutrition/');
 await page.locator('#startDate').fill('2026-10-25');
 await page.locator('#startDate').dispatchEvent('change');
 await page.locator('#endDate').fill('2026-10-29');
 await page.locator('#endDate').dispatchEvent('change');
 await page.reload();
 await expect(page.locator('#startDate')).toHaveValue('2026-10-25');
 await expect(page.locator('#endDate')).toHaveValue('2026-10-29');
 await expect(page.locator('.day-card')).toHaveCount(5);
});

test('Nutrition : dates invalides refusées',async({page})=>{
 await page.goto('/sport/nutrition/');
 await page.locator('#startDate').fill('2026-11-10');
 await page.locator('#startDate').dispatchEvent('change');
 await expect(page.locator('#startDate')).toHaveValue('2026-10-24');
 await expect(page.locator('.day-card')).toHaveCount(15);
});

test('Nutrition : bouton de synchronisation Cloudflare présent',async({page})=>{
 await page.goto('/sport/nutrition/');
 await expect(page.locator('#cloudNutrition')).toBeVisible();
});
