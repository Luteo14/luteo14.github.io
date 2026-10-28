const { test, expect } = require('@playwright/test');
test('@smoke Mon Coach affiche les indicateurs', async ({ page }) => {
  await page.goto('/sport/coach/');
  for (const id of ['focusBattery','focusSleep','focusHrv','focusDistance']) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  await expect(page.locator('#focusCustomize')).toBeVisible();
});
test('données : deux synchronisations distinctes', async ({ page }) => {
  await page.goto('/sport/donnees/');
  await expect(page.locator('#stravaDataSync')).toBeVisible();
  await expect(page.locator('#garminDataSync')).toBeVisible();
});
