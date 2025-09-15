import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  console.log('🔍 Testing Delimiter Tool...\n');

  try {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Click on the Delimiter tab
    console.log('📋 Looking for Delimiter tab...');
    const delimiterTab = page.locator('a[href="/tools/delimiter"]');

    if (await delimiterTab.count() > 0) {
      console.log('✅ Found Delimiter tab!');
      await delimiterTab.click();
      await page.waitForLoadState('networkidle');

      // Test the functionality
      console.log('🧪 Testing delimiter functionality...');

      // Add some test data
      const testData = 'apple,banana,cherry,orange,grape';
      await page.locator('textarea').first().fill(testData);

      // Click "To Lines" button
      await page.locator('button:has-text("To Lines")').click();
      await page.waitForTimeout(1000);

      // Check if conversion worked
      const rightTextarea = page.locator('textarea').nth(1);
      const convertedText = await rightTextarea.inputValue();

      if (convertedText.includes('apple\nbanana\ncherry')) {
        console.log('✅ Delimiter to newlines conversion works!');
      } else {
        console.log('❌ Conversion may not be working correctly');
        console.log('Converted text:', convertedText);
      }

      // Test reverse conversion
      console.log('🔄 Testing reverse conversion...');
      await page.locator('button:has-text("To Delimited")').click();
      await page.waitForTimeout(1000);

      const backConverted = await page.locator('textarea').first().inputValue();
      console.log('Back converted:', backConverted);

      // Take screenshots
      await page.screenshot({
        path: '/Users/shaurya/repos/devyantra-ui/delimiter-tool-test.png',
        fullPage: true
      });
      console.log('📸 Screenshot saved as delimiter-tool-test.png');

    } else {
      console.log('❌ Delimiter tab not found!');

      // List available tabs
      const tabs = await page.locator('.nav-tab').all();
      console.log(`Found ${tabs.length} tabs:`);
      for (let i = 0; i < tabs.length; i++) {
        const text = await tabs[i].textContent();
        console.log(`  - Tab ${i + 1}: ${text?.trim()}`);
      }
    }

  } catch (error) {
    console.error('❌ Error testing delimiter tool:', error);
  }

  // Wait for manual inspection
  console.log('\n⏸️  Waiting 15 seconds for manual inspection...');
  await page.waitForTimeout(15000);

  await browser.close();
  console.log('\n✅ Delimiter tool test complete!');
})();