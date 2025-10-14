# Playwright Tests for www

This package contains end-to-end tests for the www application using Playwright.

## Environment Requirements

Before running tests, ensure you have:

- **Node.js**: v18.x or higher
- **Operating System**: macOS, Linux, or Windows
- **Browsers**: Playwright browsers installed (see installation below)

## Getting Started

### Install Dependencies

First, install the Playwright browsers:

```bash
npx playwright install
```

### Running Tests

```bash
# Run all tests
pnpm run test:e2e

# Run tests with UI
pnpm run test:e2e:ui

# Run tests in headed mode (visible browser)
pnpm run test:e2e:headed

# Run tests in debug mode
pnpm run test:e2e:debug
```

### Using Turbo

You can also run tests using Turbo from the root:

```bash
# Run e2e tests for this package
turbo run e2e --filter=@repo/playwright-www
```

## Test Structure

- `tests/` - Contains all test files
- `tests/test-results/` - Test artifacts (screenshots, traces, reports)
- `playwright.config.ts` - Playwright configuration

## Configuration

The tests are configured to:
- Start the www app on `http://localhost:3000` before running tests
- Run tests in parallel across Chromium, Firefox, and WebKit
- Take screenshots for visual verification
- Retry failed tests on CI
