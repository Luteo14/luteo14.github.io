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
 expect(download.suggestedFilename()).toMatch(/courses-marathon-2026\.csv$/);
});
