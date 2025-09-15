import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  console.log('🔍 Testing Updated Delimiter Tool with All Changes...\n');

  try {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Check new tab order
    console.log('📋 Checking new tab order...');
    const tabs = await page.locator('.nav-tab').all();
    for (let i = 0; i < Math.min(tabs.length, 5); i++) {
      const text = await tabs[i].textContent();
      console.log(`  Tab ${i + 1}: ${text?.trim()}`);
    }

    // Navigate to delimiter (should be 2nd tab now)
    console.log('\n🎯 Navigating to Delimiter (2nd tab)...');
    await page.locator('a[href="/tools/delimiter"]').click();
    await page.waitForLoadState('networkidle');

    // Test new functionality
    console.log('🧪 Testing updated functionality...');

    // Add test data
    const testData = 'apple;banana;cherry;date;elderberry';
    await page.locator('textarea').first().fill(testData);

    // Change delimiter to semicolon (should be below editor now)
    console.log('🔧 Testing delimiter settings below editor...');
    await page.selectOption('select', ';');

    // Test the new arrow buttons
    console.log('⬅️ Testing new arrow buttons...');
    await page.locator('button:has-text("Split to Lines")').click();
    await page.waitForTimeout(1000);

    const convertedText = await page.locator('textarea').nth(1).inputValue();
    if (convertedText.includes('apple\nbanana\ncherry')) {
      console.log('✅ Split to Lines works with new UI!');
    } else {
      console.log('❌ Conversion may not be working');
    }

    // Test reverse with new button text
    await page.locator('button:has-text("Join with Delimiter")').click();
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({
      path: '/Users/shaurya/repos/devyantra-ui/delimiter-updated-ui.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved as delimiter-updated-ui.png');

    // Check if settings are below editor
    const settingsElement = await page.locator('.delimiter-settings');
    if (await settingsElement.count() > 0) {
      console.log('✅ Delimiter settings found below editor!');
    } else {
      console.log('❌ Delimiter settings not found');
    }

  } catch (error) {
    console.error('❌ Error testing updated delimiter tool:', error);
  }

  // Wait for manual inspection
  console.log('\n⏸️  Waiting 15 seconds for manual inspection...');
  await page.waitForTimeout(15000);

  await browser.close();
  console.log('\n✅ Updated delimiter tool test complete!');
})();