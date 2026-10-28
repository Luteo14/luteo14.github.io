# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: nutrition.spec.js >> Nutrition : export CSV de courses
- Location: tests\nutrition.spec.js:29:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:8766/sport/nutrition/
Call log:
  - navigating to "http://127.0.0.1:8766/sport/nutrition/", waiting until "load"

```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | 
  3  | test('Nutrition : 15 journées et menu commun',async({page})=>{
  4  |  await page.goto('/sport/nutrition/');
  5  |  await expect(page.locator('.day-card')).toHaveCount(15);
  6  |  await expect(page.locator('.day-card .meal select')).toHaveCount(60);
  7  |  await expect(page.locator('.luteo-nav a', {hasText:'Nutrition'})).toBeVisible();
  8  | });
  9  | 
  10 | test('Nutrition : quantités recalculées pour deux puis trois personnes',async({page})=>{
  11 |  await page.goto('/sport/nutrition/');
  12 |  await page.getByRole('button',{name:'Liste de courses'}).click();
  13 |  const before=await page.locator('#shopping').innerText();
  14 |  await page.locator('#persons').fill('3');
  15 |  await page.locator('#persons').dispatchEvent('change');
  16 |  const after=await page.locator('#shopping').innerText();
  17 |  expect(after).not.toBe(before);
  18 | });
  19 | 
  20 | test('Nutrition : modification conservée après rechargement',async({page})=>{
  21 |  await page.goto('/sport/nutrition/');
  22 |  const first=page.locator('.day-card .meal select').first();
  23 |  const options=await first.locator('option').evaluateAll(nodes=>nodes.map(n=>n.value));
  24 |  await first.selectOption(options[1]);
  25 |  await page.reload();
  26 |  await expect(page.locator('.day-card .meal select').first()).toHaveValue(options[1]);
  27 | });
  28 | 
  29 | test('Nutrition : export CSV de courses',async({page})=>{
> 30 |  await page.goto('/sport/nutrition/');
     |             ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:8766/sport/nutrition/
  31 |  await page.getByRole('button',{name:'Liste de courses'}).click();
  32 |  const downloadPromise=page.waitForEvent('download');
  33 |  await page.getByRole('button',{name:'Exporter en CSV'}).click();
  34 |  const download=await downloadPromise;
  35 |  expect(download.suggestedFilename()).toMatch(/courses-marathon-2026\.csv$/);
  36 | });
  37 | 
```