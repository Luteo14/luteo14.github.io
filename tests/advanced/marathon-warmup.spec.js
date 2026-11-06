const { test, expect } = require('@playwright/test');

test('Marathon : échauffement et vidéos accessibles', async ({ page }) => {
  await page.goto('/sport/marathon/');
  await expect(page.getByRole('heading', { name: 'Mon échauffement avant le départ' })).toBeVisible();
  await expect(page.locator('#echauffement .warmup-steps li')).toHaveCount(6);
  await expect(page.locator('#echauffement .warmup-videos a')).toHaveCount(3);
  await expect(page.locator('a[href="#echauffement"]')).toBeVisible();
  for (const a of await page.locator('#echauffement .warmup-videos a').all()) {
    await expect(a).toHaveAttribute('rel', /noopener/);
    await expect(a).toHaveAttribute('href', /^https:\/\/www\.youtube\.com\/results\?/);
  }
});
