const { test, expect } = require('@playwright/test');
const pages = [
  ['/sport/', 'Accueil SPORT'],
  ['/sport/dashboard/', 'Dashboard'],
  ['/sport/coach/', 'Mon Coach'],
  ['/sport/coach/plan/', 'Plan intelligent'],
  ['/sport/objectifs/', 'Objectifs'],
  ['/sport/donnees/', 'Mes données'],
  ['/sport/synthese/', 'Synthèse']
];
for (const [path, title] of pages) {
  test(`@smoke ${title} accessible`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
  });
}
test('@smoke liens internes SPORT sans erreur 404', async ({ page, request }) => {
  await page.goto('/sport/');
  const hrefs = await page.locator('a[href^="/sport/"]').evaluateAll(nodes => [...new Set(nodes.map(a => a.getAttribute('href').split(/[?#]/)[0]))]);
  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), `Lien cassé : ${href}`).toBeLessThan(400);
  }
});
