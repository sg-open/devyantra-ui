# Tests Directory

This directory contains all test files for the DevYantra UI project.

## Structure

```
tests/
├── e2e/              # End-to-end tests using Playwright
├── unit/             # Unit tests (reserved for future use)
└── assets/           # Test assets and fixtures
```

## E2E Tests

End-to-end tests are located in `tests/e2e/` and use Playwright for browser automation.

**Running E2E tests:**
```bash
npm run test:e2e
```

**Test outputs:**
- Screenshots: `temp/screenshots/`
- Reports: `temp/reports/`
- Test results: `temp/reports/test-results/`

## Test Assets

Test fixtures, sample files, and test data are stored in `tests/assets/`.