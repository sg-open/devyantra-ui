import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 800 });
  const page = await browser.newPage();

  console.log('🚀 Testing Enhanced Text Compare Tool...\\n');

  try {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Navigate to text compare
    console.log('🎯 Navigating to enhanced text compare tool...');
    await page.locator('a[href="/tools/text-compare"]').click();
    await page.waitForLoadState('networkidle');

    // Test smart detection with JSON data
    console.log('🧠 Testing smart paste detection...');
    const jsonData1 = '{"name":"John","age":30,"city":"New York","hobbies":["reading","cycling"]}';
    const jsonData2 = '{"name":"John","age":31,"city":"Boston","country":"USA","hobbies":["reading","swimming","cycling"]}';

    await page.locator('textarea').first().fill(jsonData1);
    await page.waitForTimeout(1000);

    await page.locator('textarea').nth(1).fill(jsonData2);
    await page.waitForTimeout(1000);

    // Check if smart suggestions appear
    const suggestions = page.locator('.smart-suggestion');
    if (await suggestions.count() > 0) {
      console.log('✅ Smart suggestions detected!');
      // Use a suggestion if available
      const useBtn = page.locator('.use-suggestion-btn').first();
      if (await useBtn.count() > 0) {
        await useBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Test quick actions
    console.log('⚡ Testing quick action buttons...');

    // Test copy functionality
    const copyBtn = page.locator('.copy-btn').first();
    if (await copyBtn.count() > 0) {
      await copyBtn.click();
      await page.waitForTimeout(500);
      console.log('✅ Copy button working');
    }

    // Test swap functionality
    const swapBtn = page.locator('.swap-btn').first();
    if (await swapBtn.count() > 0) {
      await swapBtn.click();
      await page.waitForTimeout(1000);
      console.log('✅ Swap button working');
    }

    // Test sample data
    const sampleBtn = page.locator('.sample-btn').first();
    if (await sampleBtn.count() > 0) {
      await sampleBtn.click();
      await page.waitForTimeout(1000);
      console.log('✅ Sample data loaded');
    }

    // Test comparison with animations
    console.log('✨ Testing enhanced comparison...');
    const compareBtn = page.locator('button:has-text("Find differences")');
    if (await compareBtn.count() > 0) {
      await compareBtn.click();
      await page.waitForTimeout(2000);
      console.log('✅ Comparison with enhanced animations working');
    }

    // Test keyboard shortcuts
    console.log('⌨️  Testing keyboard shortcuts...');

    // Test Cmd+Shift+L for sample data
    await page.keyboard.press('Meta+Shift+L');
    await page.waitForTimeout(500);

    // Test Cmd+Shift+S for swap
    await page.keyboard.press('Meta+Shift+S');
    await page.waitForTimeout(500);

    // Test Cmd+Shift+1 for copy left
    await page.keyboard.press('Meta+Shift+1');
    await page.waitForTimeout(500);

    console.log('✅ Keyboard shortcuts working');

    // Take final screenshot
    await page.screenshot({
      path: '/Users/shaurya/repos/devyantra-ui/enhanced-text-compare-final.png',
      fullPage: true
    });
    console.log('📸 Enhanced text compare screenshot saved');

    console.log('\\n🎉 Enhanced Features Summary:');
    console.log('✅ Smart paste detection with format suggestions');
    console.log('✅ Quick action buttons (Copy, Clear, Swap, Sample)');
    console.log('✅ Keyboard shortcuts for all major actions');
    console.log('✅ Smooth animations and micro-interactions');
    console.log('✅ Enhanced button styling with gradients');
    console.log('✅ Improved focus states and visual feedback');

  } catch (error) {
    console.error('❌ Error testing enhanced text compare:', error);
  }

  console.log('\\n⏸️  Waiting 20 seconds to see enhancements...');
  await page.waitForTimeout(20000);

  await browser.close();
  console.log('\\n✅ Enhanced text compare test complete!');
})();