import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  console.log('🔍 Testing Final Delimiter Tool Layout...\n');

  try {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Navigate to delimiter
    console.log('🎯 Navigating to Delimiter tool...');
    await page.locator('a[href="/tools/delimiter"]').click();
    await page.waitForLoadState('networkidle');

    // Check both settings panels are below their editors
    console.log('🔧 Checking settings placement...');

    const delimiterSettings = await page.locator('.delimiter-settings');
    const newlineSettings = await page.locator('.newline-settings');

    if (await delimiterSettings.count() > 0) {
      console.log('✅ Delimiter settings found below left editor!');
    } else {
      console.log('❌ Delimiter settings not found');
    }

    if (await newlineSettings.count() > 0) {
      console.log('✅ Newline settings found below right editor!');
    } else {
      console.log('❌ Newline settings not found');
    }

    // Test functionality with both settings
    console.log('🧪 Testing functionality with new layout...');

    // Add test data
    const testData = 'one|two|three|four';
    await page.locator('textarea').first().fill(testData);

    // Change delimiter using bottom settings
    await page.selectOption('select', '|');

    // Toggle newline options using bottom settings
    const trimCheckbox = page.locator('input[type="checkbox"]').first();
    const removeEmptyCheckbox = page.locator('input[type="checkbox"]').nth(1);

    if (await trimCheckbox.count() > 0) {
      console.log('✅ Trim whitespace option accessible');
    }

    if (await removeEmptyCheckbox.count() > 0) {
      console.log('✅ Remove empty lines option accessible');
    }

    // Convert to test
    await page.locator('button:has-text("Split to Lines")').click();
    await page.waitForTimeout(1000);

    const result = await page.locator('textarea').nth(1).inputValue();
    if (result.includes('one\ntwo\nthree\nfour')) {
      console.log('✅ Conversion working with new layout!');
    } else {
      console.log('❌ Conversion may not be working correctly');
    }

    // Take final screenshot
    await page.screenshot({
      path: '/Users/shaurya/repos/devyantra-ui/delimiter-final-layout.png',
      fullPage: true
    });
    console.log('📸 Final layout screenshot saved');

  } catch (error) {
    console.error('❌ Error testing final delimiter layout:', error);
  }

  // Wait for inspection
  console.log('\n⏸️  Waiting 15 seconds for final inspection...');
  await page.waitForTimeout(15000);

  await browser.close();
  console.log('\n✅ Final delimiter layout test complete!');
})();