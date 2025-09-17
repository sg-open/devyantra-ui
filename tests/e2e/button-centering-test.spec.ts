import { test, expect } from '@playwright/test';

test('Verify button text centering', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5175');
  await page.waitForLoadState('networkidle');

  // Take screenshot focusing on Feedback button area for detailed centering examination
  await page.screenshot({
    path: './temp/screenshots/button-centering-detailed.png',
    fullPage: false,
    clip: { x: 980, y: 0, width: 220, height: 120 }
  });

  console.log('Button centering screenshot captured!');
});