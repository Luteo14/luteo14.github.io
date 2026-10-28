const { test, expect } = require('@playwright/test');
test('@smoke aucun secret évident dans les fichiers publics testés', async ({ request }) => {
  const paths = ['/sport/js/config.js','/sport/coach/plan/plan.js','/sport/coach/coach.js'];
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body, path).not.toMatch(/GARMIN_PERSONAL_API_KEY\s*[:=]\s*['"][^'"]{12,}/);
    expect(body, path).not.toMatch(/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/);
  }
});
