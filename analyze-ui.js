import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  console.log('🔍 Analyzing DevYantra UI Structure...\n');

  // Navigate to the app
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // Analyze current navigation structure
  console.log('📋 Current Tools and Navigation:');

  // Check for any navigation elements
  const navElements = await page.locator('nav, .nav, .navigation, .toolbar, .menu').all();
  console.log(`Found ${navElements.length} navigation elements`);

  // Look for tool links/buttons
  const toolLinks = await page.locator('a[href^="/"], button[data-tool], .tool-link, .nav-item').all();
  console.log(`Found ${toolLinks.length} potential tool navigation items`);

  for (let i = 0; i < toolLinks.length; i++) {
    const link = toolLinks[i];
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    const className = await link.getAttribute('class');
    console.log(`  - Tool ${i + 1}: "${text?.trim()}" (href: ${href}, class: ${className})`);
  }

  // Check main content area structure
  console.log('\n🎯 Main Content Structure:');
  const mainContent = page.locator('#main-content, .main-content, main');
  const contentText = await mainContent.textContent();
  console.log(`Main content preview: ${contentText?.substring(0, 200)}...`);

  // Look for current tool patterns
  console.log('\n🛠️ Current Tool Interface Patterns:');

  // Check for tabs/tool switcher
  const tabs = await page.locator('.tab, .tool-tab, .switcher, .selector').all();
  console.log(`Found ${tabs.length} tab-like elements`);

  // Check for tool sections
  const toolSections = await page.locator('[data-tool], .tool-section, .tool-container').all();
  console.log(`Found ${toolSections.length} tool section elements`);

  // Look for button patterns
  const buttons = await page.locator('button').all();
  console.log(`\n🔘 Found ${buttons.length} buttons:`);
  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const button = buttons[i];
    const text = await button.textContent();
    const className = await button.getAttribute('class');
    console.log(`  - "${text?.trim()}" (class: ${className})`);
  }

  // Check for form elements and input patterns
  console.log('\n📝 Input/Form Patterns:');
  const textareas = await page.locator('textarea').count();
  const inputs = await page.locator('input').count();
  const selects = await page.locator('select').count();
  console.log(`  - Textareas: ${textareas}`);
  console.log(`  - Inputs: ${inputs}`);
  console.log(`  - Selects: ${selects}`);

  // Take a screenshot for analysis
  await page.screenshot({
    path: '/Users/shaurya/repos/devyantra-ui/ui-analysis.png',
    fullPage: true
  });
  console.log('\n📸 Screenshot saved as ui-analysis.png');

  // Wait a moment to view the UI
  console.log('\n⏸️  Waiting 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\n✅ UI Analysis Complete!');
})();