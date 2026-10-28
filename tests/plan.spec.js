const { test, expect } = require('@playwright/test');
test('@smoke le calendrier charge et indique le verrouillage cloud', async ({ page }) => {
  await page.goto('/sport/coach/plan/');
  await expect(page.locator('#calendar')).toBeVisible();
  await expect(page.locator('#connect')).toBeVisible();
  await expect(page.locator('#save')).toBeDisabled();
});
test('ajout local de séance sans écrire en production', async ({ page }) => {
  await page.goto('/sport/coach/plan/');
  await page.locator('#date').fill('2026-11-02');
  await page.locator('#title').fill('Séance test QA');
  await page.locator('#km').fill('8');
  await page.locator('#sessionForm button[type="submit"]').click();
  await expect(page.locator('#cloudState')).toContainText(/enregistrer|modification/i);
  await expect(page.locator('#save')).toBeDisabled();
});
test('générateur et GPX présents', async ({ page }) => {
  await page.goto('/sport/coach/plan/');
  await expect(page.locator('#generatePlan')).toBeVisible();
  await expect(page.locator('#exportGpx')).toBeVisible();
  await expect(page.locator('#gpxRoute')).toBeAttached();
});
