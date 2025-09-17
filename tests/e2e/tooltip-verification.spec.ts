import { test, expect } from '@playwright/test';

test('Verify privacy tooltip styling in both light and dark modes', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5175');
  await page.waitForLoadState('networkidle');

  // Test Light Mode Privacy Tooltip
  console.log('Testing Privacy tooltip in light mode...');

  // Hover over Privacy First badge
  const privacyBadge = page.locator('.privacy-badge');
  await privacyBadge.hover({ force: true });

  // Wait for tooltip to appear
  const tooltip = page.locator('.p-tooltip');
  await tooltip.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(1000);

  // Take screenshot of privacy tooltip in light mode
  await page.screenshot({
    path: './temp/screenshots/privacy-tooltip-light-mode.png',
    fullPage: false,
    clip: { x: 0, y: 0, width: 1200, height: 250 }
  });

  // Move mouse away to hide tooltip
  await page.mouse.move(500, 300);
  await page.waitForTimeout(500);

  // Switch to Dark Mode
  console.log('Switching to dark mode...');
  const themeToggle = page.locator('.theme-toggle-btn');
  await themeToggle.click();
  await page.waitForTimeout(1000);

  // Test Dark Mode Privacy Tooltip
  console.log('Testing Privacy tooltip in dark mode...');

  // Hover over Privacy First badge in dark mode
  await privacyBadge.hover({ force: true });
  await tooltip.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(1000);

  // Take screenshot of privacy tooltip in dark mode
  await page.screenshot({
    path: './temp/screenshots/privacy-tooltip-dark-mode.png',
    fullPage: false,
    clip: { x: 0, y: 0, width: 1200, height: 250 }
  });

  // Also test feedback tooltip in dark mode
  await page.mouse.move(500, 300);
  await page.waitForTimeout(500);

  const feedbackBtn = page.locator('.feedback-btn');
  await feedbackBtn.hover({ force: true });
  await tooltip.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: './temp/screenshots/feedback-tooltip-dark-mode.png',
    fullPage: false,
    clip: { x: 0, y: 0, width: 1200, height: 250 }
  });

  console.log('All tooltip screenshots captured successfully!');
});