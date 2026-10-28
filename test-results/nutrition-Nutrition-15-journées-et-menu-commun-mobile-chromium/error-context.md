# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: nutrition.spec.js >> Nutrition : 15 journées et menu commun
- Location: tests\nutrition.spec.js:3:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.day-card')
Expected: 15
Received: 0
Timeout:  8000ms

Call log:
  - Expect "toHaveCount" locator('.day-card') with timeout 8000ms
  - waiting for locator('.day-card')
    20 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation "Navigation SPORT" [ref=e2]:
    - link "LUTEO14 // SPORT" [ref=e3] [cursor=pointer]:
      - /url: /sport/
    - generic [ref=e4]:
      - link "Accueil" [ref=e5] [cursor=pointer]:
        - /url: /sport/
      - link "Synthèse" [ref=e6] [cursor=pointer]:
        - /url: /sport/synthese/
      - link "Dashboard" [ref=e7] [cursor=pointer]:
        - /url: /sport/dashboard/
      - link "Plan" [ref=e8] [cursor=pointer]:
        - /url: /sport/dashboard/?tab=training
      - link "Mon Coach" [ref=e9] [cursor=pointer]:
        - /url: /sport/coach/
      - link "Performance" [ref=e10] [cursor=pointer]:
        - /url: /sport/dashboard/?tab=performance
      - link "Objectifs" [ref=e11] [cursor=pointer]:
        - /url: /sport/objectifs/
      - link "Nutrition" [ref=e12] [cursor=pointer]:
        - /url: /sport/nutrition/
      - link "Mes données" [ref=e13] [cursor=pointer]:
        - /url: /sport/donnees/
  - generic "Fil d’Ariane" [ref=e14]:
    - link "SPORT" [ref=e15] [cursor=pointer]:
      - /url: /sport/
    - text: /
    - strong [ref=e16]: Nutrition
  - main [ref=e17]:
    - generic [ref=e18]:
      - paragraph [ref=e19]: SPORT / NUTRITION
      - heading "Nutrition · Préparation marathon" [level=1] [ref=e20]
      - paragraph [ref=e21]:
        - text: 15 jours de repas, recettes et liste de courses. Marathon du
        - strong [ref=e22]: 8 novembre 2026
        - text: .
      - generic [ref=e23]:
        - generic [ref=e24]: 24 octobre → 7 novembre
        - generic [ref=e25]: 2 personnes par défaut
        - generic [ref=e26]: Repas modifiables
    - region "Paramètres" [ref=e27]:
      - generic [ref=e28]: Nombre de personnes
      - spinbutton "Nombre de personnes" [ref=e29]: "2"
      - button "Réinitialiser les menus" [ref=e30] [cursor=pointer]
      - button "Imprimer" [ref=e31] [cursor=pointer]
      - status [ref=e32]: "Impossible de charger les recettes : Failed to fetch"
    - generic [ref=e33]:
      - strong [ref=e34]: Repères d'affûtage
      - paragraph [ref=e35]: Les propositions sont des exemples de repas pour deux personnes, pas une prescription nutritionnelle. Les besoins énergétiques dépendent de la charge, du gabarit et de la tolérance digestive. Dans les 48 heures précédant la course, privilégie les aliments déjà testés, des glucides suffisants et des portions digestes. Ne teste rien de nouveau le jour J.
    - group "Affichage" [ref=e36]:
      - button "Calendrier" [ref=e37] [cursor=pointer]
      - button "Liste de courses" [ref=e38] [cursor=pointer]
    - generic [ref=e39]:
      - heading "Mes repas du 24 octobre au 7 novembre" [level=2] [ref=e40]
      - paragraph [ref=e41]: Sélectionne une recette pour chaque repas. Les ingrédients et quantités sont recalculés automatiquement.
    - generic [ref=e42]:
      - heading "Jour J — 8 novembre" [level=2] [ref=e43]
      - paragraph [ref=e44]: "Prévois un petit-déjeuner familier environ 3 à 4 heures avant le départ si cela correspond à tes habitudes. Prépare tes ravitaillements et ta boisson selon les quantités testées pendant les sorties longues. Les produits du jour J ne sont pas ajoutés automatiquement aux courses : ajoute-les selon ton protocole personnel."
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | 
  3  | test('Nutrition : 15 journées et menu commun',async({page})=>{
  4  |  await page.goto('/sport/nutrition/');
> 5  |  await expect(page.locator('.day-card')).toHaveCount(15);
     |                                          ^ Error: expect(locator).toHaveCount(expected) failed
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
  30 |  await page.goto('/sport/nutrition/');
  31 |  await page.getByRole('button',{name:'Liste de courses'}).click();
  32 |  const downloadPromise=page.waitForEvent('download');
  33 |  await page.getByRole('button',{name:'Exporter en CSV'}).click();
  34 |  const download=await downloadPromise;
  35 |  expect(download.suggestedFilename()).toMatch(/courses-marathon-2026\.csv$/);
  36 | });
  37 | 
```