import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  console.log('🔍 Testing Updated Delimiter Tool with Card Structure...\n');

  try {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Click on the Delimiter tab
    console.log('📋 Navigating to Delimiter tab...');
    const delimiterTab = page.locator('a[href="/tools/delimiter"]');
    await delimiterTab.click();
    await page.waitForLoadState('networkidle');

    // Take screenshot of the updated header
    await page.screenshot({
      path: '/Users/shaurya/repos/devyantra-ui/delimiter-card-header.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved as delimiter-card-header.png');

    // Test functionality still works
    console.log('🧪 Testing functionality...');
    const testData = 'red|blue|green|yellow';

    // Change delimiter to pipe
    await page.selectOption('select', '|');
    await page.locator('textarea').first().fill(testData);
    await page.locator('button:has-text("To Lines")').click();
    await page.waitForTimeout(1000);

    const convertedText = await page.locator('textarea').nth(1).inputValue();
    if (convertedText.includes('red\nblue\ngreen\nyellow')) {
      console.log('✅ Pipe delimiter conversion works!');
    } else {
      console.log('❌ Conversion may not be working');
      console.log('Converted text:', convertedText);
    }

  } catch (error) {
    console.error('❌ Error testing updated delimiter tool:', error);
  }

  // Wait for manual inspection
  console.log('\n⏸️  Waiting 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\n✅ Updated delimiter tool test complete!');
})();