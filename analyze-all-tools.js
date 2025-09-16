import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  console.log('🔍 Analyzing All DevYantra Tools for UX Enhancement...\\n');

  try {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Take homepage screenshot
    console.log('📸 Taking homepage screenshot...');
    await page.screenshot({
      path: '/Users/shaurya/repos/devyantra-ui/homepage-analysis.png',
      fullPage: true
    });

    // Get all tool links
    const toolLinks = await page.locator('a[href^="/tools/"]').all();
    console.log(`🔧 Found ${toolLinks.length} tools to analyze`);

    // Extract tool information
    const tools = [];
    for (const link of toolLinks) {
      const href = await link.getAttribute('href');
      const toolName = href.split('/').pop();
      const title = await link.locator('.tool-title, h3, .title').first().textContent() || '';
      const subtitle = await link.locator('.tool-subtitle, .subtitle').first().textContent() || '';

      tools.push({
        name: toolName,
        href,
        title: title.trim(),
        subtitle: subtitle.trim()
      });
    }

    console.log('\\n📋 Available tools:');
    tools.forEach((tool, i) => {
      console.log(`${i + 1}. ${tool.title} (${tool.name}) - ${tool.subtitle}`);
    });

    // Visit each tool and take screenshots
    for (const tool of tools) {
      console.log(`\\n🎯 Analyzing ${tool.title}...`);

      try {
        await page.goto(`http://localhost:5173${tool.href}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Take screenshot
        await page.screenshot({
          path: `/Users/shaurya/repos/devyantra-ui/${tool.name}-analysis.png`,
          fullPage: true
        });

        console.log(`📸 Screenshot saved for ${tool.title}`);

        // Analyze UI elements for enhancement opportunities
        const hasTextareas = await page.locator('textarea').count();
        const hasInputs = await page.locator('input').count();
        const hasButtons = await page.locator('button').count();
        const hasSelects = await page.locator('select').count();
        const hasCards = await page.locator('.card, [class*="card"]').count();

        console.log(`   📊 UI Elements: ${hasTextareas} textareas, ${hasInputs} inputs, ${hasButtons} buttons, ${hasSelects} selects, ${hasCards} cards`);

        // Check for existing enhancements
        const hasQuickButtons = await page.locator('.quick-btn, [class*="quick-btn"]').count();
        const hasKeyboardShortcuts = await page.locator('[data-shortcut], .shortcut').count();
        const hasAnimations = await page.locator('[class*="animate"], [class*="transition"]').count();

        console.log(`   ✨ Current enhancements: ${hasQuickButtons} quick buttons, ${hasKeyboardShortcuts} shortcuts, ${hasAnimations} animations`);

      } catch (error) {
        console.log(`   ❌ Error analyzing ${tool.title}: ${error.message}`);
      }
    }

    console.log('\\n📈 Analysis Summary:');
    console.log('Next: Implement comprehensive UX enhancements for each tool');
    console.log('- Quick action buttons');
    console.log('- Smart detection and suggestions');
    console.log('- Keyboard shortcuts');
    console.log('- Smooth animations');
    console.log('- Luxury micro-interactions');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }

  console.log('\\n⏸️  Waiting 10 seconds for inspection...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\\n✅ Tool analysis complete!');
})();