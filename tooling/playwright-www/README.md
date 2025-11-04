# Playwright Tests for www

This package contains end-to-end tests for the www application using Playwright.

## Environment Requirements

Before running tests, ensure you have:

- **Node.js**: v18.x or higher
- **Operating System**: macOS, Linux, or Windows
- **Browsers**: Playwright browsers installed (see installation below)

## Getting Started

### Install Dependencies

First, install project dependencies:

```bash
pnpm install
```

Then install the Playwright browsers using the workspace-pinned version:

```bash
pnpm exec playwright install
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
turbo run test:e2e --filter=@repo/playwright-www
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

### Web Server Configuration

The test suite uses **different server modes** for CI vs local development:

#### CI (Production Server)
- **Mode**: Production build (`next start`)
- **Rationale**: Faster, more stable, matches production environment
- **Timeout**: 2 minutes (120s)
- **Build Step**: GitHub Actions pre-builds the app before tests

#### Local (Development Server)
- **Mode**: Development server (`next dev`)
- **Rationale**: Hot reload, better debugging, faster iteration
- **Timeout**: 2 minutes (120s)
- **Server Reuse**: Enabled (reuses existing dev server if running)

This dual-mode approach optimizes for:
- ✅ **CI stability** - production build eliminates dev mode variability
- ✅ **CI speed** - production server starts faster than dev server
- ✅ **Local DX** - dev mode with hot reload for test development

If you encounter `webServer` timeout errors:
1. **CI**: Check build logs - build may be failing
2. **Local**: Check that `pnpm --filter=www run dev` starts successfully
3. Check for port conflicts on 3000: `lsof -ti:3000 | xargs kill`
4. Review stdout/stderr output for startup errors

## Troubleshooting

### "Timed out waiting from config.webServer"

This error occurs when the web server takes too long to start.

**CI (Production Server)**:
- Usually means the build failed or took too long
- Check GitHub Actions logs for build errors
- Production server should start in < 30 seconds

**Local (Dev Server)**:
- First-time compilation can take 2+ minutes
- Resource constraints on low-memory systems
- Port conflicts (another process using port 3000)

**Solutions**:
1. **CI**: Fix build errors, check `pnpm --filter=www run build`
2. **Local**: Free up system resources, clear Next.js cache
3. **Both**: Kill port 3000 processes: `lsof -ti:3000 | xargs kill`
4. **Both**: Clear cache: `pnpm --filter=www run clean`

### Reporter and Artifacts

The test configuration uses different reporters for CI vs local:

- **CI**: `dot` reporter (concise) + HTML artifacts (saved, never opened)
- **Local**: `list` reporter (verbose) + HTML (opens on failure)

Videos and screenshots are captured **only on failure** to reduce artifact size.
