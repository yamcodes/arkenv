# End-to-End Testing with Playwright

This guide explains how to set up and run end-to-end tests for the ArkEnv website using Playwright.

## Setup

The E2E testing setup includes:

1. **Playwright Configuration** (`playwright.config.ts`) - Configures test execution across multiple browsers
2. **Test Scripts** (package.json) - Convenient commands for running tests
3. **Test Files** (`e2e/*.spec.ts`) - Actual test implementations

## Test Files

### Homepage Tests (`e2e/homepage.spec.ts`)
- Tests main page loading and content
- Verifies navigation links work correctly
- Checks responsive design
- Validates external links

### Documentation Tests (`e2e/documentation.spec.ts`)
- Tests documentation page navigation
- Verifies sidebar functionality
- Checks search functionality if present
- Tests responsive design for docs

### Global Tests (`e2e/global.spec.ts`)
- Tests global features like meta tags
- Checks 404 error handling
- Tests theme toggle functionality
- Validates accessibility features
- Tests JavaScript error handling
- Validates banner functionality

## Running Tests

```bash
# Install Playwright browsers (one-time setup)
pnpm e2e:install

# Run all E2E tests
pnpm e2e

# Run tests with browser UI visible
pnpm e2e:headed

# Run tests with Playwright UI mode
pnpm e2e:ui
```

## Configuration

The Playwright configuration is set up to:

- Run tests across Chromium, Firefox, and WebKit browsers
- Start the development server automatically before tests
- Capture traces on test failures for debugging
- Use parallel execution for faster test runs
- Provide HTML reports for test results

## Test Structure

Each test file follows this pattern:

1. **Import** necessary Playwright functions
2. **Describe** test groups with `test.describe()`
3. **Write** individual tests with `test()`
4. **Use** page object patterns for better maintainability

## Best Practices

1. **Use semantic selectors** - Prefer `getByRole()`, `getByText()` over CSS selectors
2. **Test user flows** - Focus on what users actually do
3. **Keep tests focused** - Each test should verify one specific behavior
4. **Use proper waits** - Wait for elements to be visible/loaded before assertions
5. **Test responsive design** - Verify layout works on different screen sizes

## CI Integration

The E2E tests are designed to run in CI environments:

- Tests run in headless mode by default
- Retries are configured for CI environments
- HTML reports are generated for debugging failures
- Tests can be run in parallel for faster execution

## Troubleshooting

If tests fail:

1. Check the HTML report generated after test runs
2. Use `pnpm e2e:headed` to see tests run in browser
3. Check that the development server is running correctly
4. Verify environment variables are set properly

## Environment Variables

Tests may require these environment variables:

- `NEXT_PUBLIC_GITHUB_URL` - GitHub repository URL
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry configuration (optional)

## Future Enhancements

Potential improvements to the E2E testing setup:

1. **Visual regression testing** - Compare screenshots across test runs
2. **API testing** - Test search API endpoints
3. **Performance testing** - Measure page load times
4. **Accessibility testing** - Automated a11y checks
5. **Mobile testing** - Test on mobile device emulations