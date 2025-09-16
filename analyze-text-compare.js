import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  console.log('🔍 Analyzing Text Compare Tool for UX Enhancement...\\n');

  try {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Navigate to Text Compare
    console.log('🎯 Navigating to Text Compare tool...');
    await page.locator('a[href="/tools/text-compare"]').click();
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/shaurya/repos/devyantra-ui/text-compare-before.png',
      fullPage: true
    });
    console.log('📸 Before screenshot saved');

    // Analyze current UI elements
    console.log('🔍 Analyzing current interface...');

    const textareas = await page.locator('textarea').count();
    const buttons = await page.locator('button').count();
    const hasQuickActions = await page.locator('.quick-btn, [class*="quick"]').count();
    const hasKeyboardShortcuts = await page.locator('[data-shortcut]').count();
    const hasSmartDetection = await page.locator('.smart-suggestion, [class*="smart"]').count();

    console.log(`📊 Current state:`);
    console.log(`   - ${textareas} text areas`);
    console.log(`   - ${buttons} buttons`);
    console.log(`   - ${hasQuickActions} quick actions`);
    console.log(`   - ${hasKeyboardShortcuts} keyboard shortcuts`);
    console.log(`   - ${hasSmartDetection} smart features`);

    // Test basic functionality
    console.log('\\n🧪 Testing basic functionality...');

    const testJson1 = '{"name":"John","age":30,"city":"New York"}';
    const testJson2 = '{"name":"John","age":31,"city":"Boston","country":"USA"}';

    await page.locator('textarea').first().fill(testJson1);
    await page.locator('textarea').nth(1).fill(testJson2);
    await page.waitForTimeout(1000);

    // Try to format
    const formatButtons = await page.locator('button:has-text("Format")').all();
    if (formatButtons.length > 0) {
      console.log('✅ Format buttons found');
      await formatButtons[0].click();
      await page.waitForTimeout(500);
    }

    // Try to compare
    const compareBtn = await page.locator('button:has-text("differences"), button:has-text("Find"), button:has-text("Compare")').first();
    if (await compareBtn.count() > 0) {
      console.log('✅ Compare functionality found');
      await compareBtn.click();
      await page.waitForTimeout(2000);
    }

    // Take final screenshot
    await page.screenshot({
      path: '/Users/shaurya/repos/devyantra-ui/text-compare-current.png',
      fullPage: true
    });
    console.log('📸 Current state screenshot saved');

    console.log('\\n💡 Enhancement Opportunities Identified:');
    console.log('1. Quick format buttons (JSON, SQL, XML prettify)');
    console.log('2. Smart paste detection with format suggestions');
    console.log('3. Keyboard shortcuts for common actions');
    console.log('4. One-click text swapping between sides');
    console.log('5. Quick clear individual sides');
    console.log('6. Copy formatted text buttons');
    console.log('7. Smooth animations and micro-interactions');
    console.log('8. Visual diff preview in text areas');

  } catch (error) {
    console.error('❌ Error analyzing Text Compare:', error);
  }

  console.log('\\n⏸️  Waiting 10 seconds for inspection...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\\n✅ Text Compare analysis complete!');
})();