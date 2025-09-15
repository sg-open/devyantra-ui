# DevYantra E2E Testing Suite

This directory contains end-to-end (E2E) tests for the DevYantra UI application using Playwright.

## Overview

The E2E test suite ensures that DevYantra works correctly from a user's perspective across different browsers and devices. It covers:

- **Core functionality** - Application loading, navigation, theme switching
- **Tool-specific features** - Text comparison, JSON formatting, hash generation
- **Accessibility compliance** - WCAG guidelines, keyboard navigation, screen readers
- **Cross-browser compatibility** - Chrome, Firefox, Safari
- **Mobile responsiveness** - Touch interactions, viewport adaptation
- **Performance validation** - Load times, rendering metrics

## Test Structure

```
e2e/
├── fixtures/
│   └── base.ts              # Custom test fixtures and page objects
├── core.spec.ts             # Core application functionality
├── text-compare.spec.ts     # Text comparison tool tests
├── json-formatter.spec.ts   # JSON formatter tool tests
├── hash-generator.spec.ts   # Hash generator tool tests
├── accessibility.spec.ts    # Accessibility compliance tests
└── README.md               # This file
```

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Local Development

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# Run specific test file
npx playwright test core.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium

# Run tests with specific tag
npx playwright test --grep "accessibility"
```

### Configuration

The test configuration is defined in `playwright.config.ts` with:

- **Multiple browsers**: Chromium, Firefox, WebKit
- **Mobile devices**: Pixel 5, iPhone 12
- **Base URL**: `http://localhost:5173` (development server)
- **Automatic server startup**: Starts dev server before tests
- **Retry logic**: 2 retries in CI, 0 locally
- **Parallel execution**: Tests run in parallel for speed

## Test Categories

### 1. Core Functionality Tests (`core.spec.ts`)

- ✅ Application loading and initialization
- ✅ SEO meta tags validation
- ✅ Theme switching (light/dark mode)
- ✅ Skip links for accessibility
- ✅ Mobile responsiveness
- ✅ Keyboard navigation
- ✅ Performance metrics validation
- ✅ Error-free loading

### 2. Text Comparison Tests (`text-compare.spec.ts`)

- ✅ Basic text comparison interface
- ✅ Identical text handling
- ✅ Different text highlighting
- ✅ View mode switching (split/unified)
- ✅ File upload functionality
- ✅ File size validation
- ✅ Line number preservation
- ✅ Empty input handling
- ✅ Syntax highlighting
- ✅ Mobile compatibility

### 3. JSON Formatter Tests (`json-formatter.spec.ts`)

- ✅ JSON formatting interface
- ✅ Valid JSON formatting
- ✅ Invalid JSON error handling
- ✅ Automatic type detection
- ✅ Nested object formatting
- ✅ Array formatting
- ✅ Clear functionality
- ✅ Clipboard operations
- ✅ SQL formatting detection
- ✅ Large file handling
- ✅ Mobile responsiveness
- ✅ Minification/compacting

### 4. Hash Generator Tests (`hash-generator.spec.ts`)

- ✅ Hash generator interface
- ✅ MD5 hash generation
- ✅ SHA-256 hash generation
- ✅ SHA-1 hash generation
- ✅ Empty input handling
- ✅ Large text processing
- ✅ Clipboard copy functionality
- ✅ Clear functionality
- ✅ Algorithm consistency
- ✅ Case sensitivity
- ✅ Special character support
- ✅ Mobile compatibility
- ✅ Output format validation

### 5. Accessibility Tests (`accessibility.spec.ts`)

- ✅ Skip links functionality
- ✅ Heading hierarchy (h1-h6)
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support
- ✅ Focus indicators visibility
- ✅ Semantic HTML structure
- ✅ High contrast mode support
- ✅ Form validation announcements
- ✅ Language attributes
- ✅ Screen reader navigation
- ✅ Reduced motion preferences
- ✅ Color contrast compliance
- ✅ Zoom support (up to 200%)

## Custom Fixtures

The test suite includes custom fixtures in `fixtures/base.ts`:

### DevYantraPageObjects

Custom page object model providing:

- `navigateToTool(toolName)` - Navigate to specific tools
- `waitForPageLoad()` - Wait for complete page loading
- `checkAccessibility()` - Run accessibility checks
- `toggleTheme()` - Switch between light/dark themes
- `getCurrentTheme()` - Get current theme state

## CI/CD Integration

### GitHub Actions Workflow

The E2E tests run automatically on:

- **Push to main/develop branches**
- **Pull requests to main/develop**

The workflow includes:

1. **Cross-browser testing** - Chrome, Firefox, Safari
2. **Mobile testing** - iOS and Android devices
3. **Accessibility validation** - WCAG compliance
4. **Performance monitoring** - Load time validation
5. **Test artifacts** - Reports and screenshots on failure

### Test Reports

- **HTML Report**: Interactive test results with screenshots
- **JUnit XML**: For CI/CD integration
- **JSON Report**: Machine-readable test results
- **Video recordings**: For failed tests
- **Screenshots**: On test failures

## Best Practices

### Writing Tests

1. **Use semantic selectors**: Prefer `role`, `aria-label`, or `text` over CSS classes
2. **Wait for elements**: Use `waitForSelector` instead of fixed timeouts
3. **Test user flows**: Focus on complete user journeys
4. **Mock external dependencies**: Keep tests isolated
5. **Handle flaky tests**: Use proper waits and retries

### Debugging

1. **Use headed mode**: `--headed` flag to see browser
2. **Debug mode**: `--debug` flag for step-by-step debugging
3. **Screenshots**: Automatic capture on failures
4. **Video recording**: Available for complex issue reproduction
5. **Browser dev tools**: Access via `page.pause()`

### Performance

1. **Parallel execution**: Tests run in parallel by default
2. **Browser reuse**: Same browser instance for related tests
3. **Selective running**: Use `--grep` for specific test subsets
4. **Resource cleanup**: Automatic cleanup between tests

## Accessibility Standards

Tests validate compliance with:

- **WCAG 2.1 AA** guidelines
- **Section 508** requirements
- **WAI-ARIA** best practices
- **Keyboard navigation** standards
- **Screen reader** compatibility

## Browser Support

### Desktop Browsers
- ✅ **Chrome/Chromium** (Latest)
- ✅ **Firefox** (Latest)
- ✅ **Safari/WebKit** (Latest)

### Mobile Devices
- ✅ **Chrome Mobile** (Android)
- ✅ **Safari Mobile** (iOS)

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure port 5173 is available
2. **Browser installation**: Run `npx playwright install`
3. **Timeout errors**: Increase timeout in configuration
4. **Flaky tests**: Add proper waits for dynamic content

### Debug Commands

```bash
# Run specific test with debug
npx playwright test core.spec.ts --debug

# Generate test code
npx playwright codegen http://localhost:5173

# Show test report
npx playwright show-report

# Test on specific device
npx playwright test --project="Mobile Chrome"
```

## Contributing

When adding new E2E tests:

1. Follow existing test patterns
2. Add proper accessibility checks
3. Test on mobile devices
4. Include error scenarios
5. Update this documentation

## Links

- [Playwright Documentation](https://playwright.dev/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [DevYantra Repository](https://github.com/devyantra/devyantra-ui)