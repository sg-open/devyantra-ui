import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 800 });
  const page = await browser.newPage();

  console.log('🚀 Testing Enhanced Delimiter Tool...\n');

  try {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Navigate to delimiter
    console.log('🎯 Navigating to enhanced delimiter tool...');
    await page.locator('a[href="/tools/delimiter"]').click();
    await page.waitForLoadState('networkidle');

    // Test quick delimiter buttons
    console.log('🔘 Testing quick delimiter buttons...');

    // Test comma button
    await page.locator('.delimiter-btn:has-text("Comma")').click();
    await page.waitForTimeout(500);

    // Test pipe button
    await page.locator('.delimiter-btn:has-text("Pipe")').click();
    await page.waitForTimeout(500);

    // Test smart detection with CSV data
    console.log('🧠 Testing smart paste detection...');
    const csvData = 'John,Doe,25,Engineer\nJane,Smith,30,Designer\nBob,Johnson,35,Manager';
    await page.locator('textarea').first().fill(csvData);
    await page.waitForTimeout(1000);

    // Check if suggestion appears
    const suggestion = page.locator('.smart-suggestion');
    if (await suggestion.count() > 0) {
      console.log('✅ Smart suggestion detected!');
      const suggestionText = await suggestion.textContent();
      console.log(`   Suggestion: ${suggestionText}`);

      // Use the suggestion
      await page.locator('.use-suggestion-btn').click();
      await page.waitForTimeout(500);
    } else {
      console.log('ℹ️  No smart suggestion (may already be using correct delimiter)');
    }

    // Test conversion with animations
    console.log('✨ Testing animated conversion...');
    await page.locator('button:has-text("Split to Lines")').click();
    await page.waitForTimeout(1500);

    // Test keyboard shortcuts
    console.log('⌨️  Testing keyboard shortcuts...');

    // Test Cmd+2 for pipe
    await page.keyboard.press('Meta+2');
    await page.waitForTimeout(500);

    // Test Cmd+1 for comma
    await page.keyboard.press('Meta+1');
    await page.waitForTimeout(500);

    // Test custom delimiter
    console.log('🛠️  Testing custom delimiter...');
    await page.locator('.custom-btn').click();
    await page.waitForTimeout(500);

    if (await page.locator('.custom-delimiter-input').count() > 0) {
      await page.locator('.custom-delimiter-input').fill('::');
      await page.waitForTimeout(500);
      console.log('✅ Custom delimiter input working');
    }

    // Test with different data
    const customData = 'item1::item2::item3::item4';
    await page.locator('textarea').first().fill(customData);
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Split to Lines")').click();
    await page.waitForTimeout(1000);

    const result = await page.locator('textarea').nth(1).inputValue();
    if (result.includes('item1\nitem2\nitem3\nitem4')) {
      console.log('✅ Custom delimiter conversion working!');
    }

    // Take final screenshot
    await page.screenshot({
      path: '/Users/shaurya/repos/devyantra-ui/enhanced-delimiter-final.png',
      fullPage: true
    });
    console.log('📸 Enhanced delimiter screenshot saved');

  } catch (error) {
    console.error('❌ Error testing enhanced delimiter:', error);
  }

  console.log('\n⏸️  Waiting 20 seconds to see animations and interactions...');
  await page.waitForTimeout(20000);

  await browser.close();
  console.log('\n✅ Enhanced delimiter test complete!');
})();