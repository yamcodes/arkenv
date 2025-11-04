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

### Build Requirements

**Important**: The `arkenv` package must be built before running tests. This is because:

1. The www app's MDX documentation files import from `arkenv`
2. `fumadocs-twoslash` validates TypeScript code examples in MDX at build/dev time  
3. Without built types, TypeScript validation fails with "Cannot find module 'arkenv'"

**In CI**: GitHub Actions runs `pnpm run build --filter=www...` which builds `www` and all its dependencies (including `arkenv`)

**Locally**: Run `pnpm run build` (at least once) from the root, or `pnpm run build --filter=www...`

### Web Server Configuration

The test suite uses **different server modes** for CI vs local development:

#### CI (Production Server)
- **Mode**: Production build (`next start`)
- **Rationale**: Faster startup, more stable, matches production environment
- **Timeout**: 2 minutes (120s)
- **Build Step**: `turbo run build --filter=www...` (builds www + dependencies)

#### Local (Development Server)
- **Mode**: Development server (`next dev`)
- **Rationale**: Hot reload, better debugging, faster iteration
- **Timeout**: 2 minutes (120s)
- **Server Reuse**: Enabled (reuses existing dev server if running)

**Why production in CI?**
- ✅ **Faster startup** - Production server starts in ~15-30s vs 60-120s for dev
- ✅ **More stable** - No hot reload, no file watchers, deterministic behavior
- ✅ **Tests what users see** - Production build = actual deployed code
- ✅ **Fewer flakes** - Dev mode variability eliminated

## Troubleshooting

### "Timed out waiting from config.webServer"

This error occurs when the web server takes too long to start.

**In CI (Production Server)**:
- Production server should start in < 30 seconds
- Usually means the build failed (check earlier workflow steps)
- Check that `pnpm --filter=www run build` succeeded
- Verify `pnpm --filter=www run start` works locally

**Locally (Dev Server)**:
- First-time compilation can take 1-2 minutes (Next.js 16 + React 19)
- Resource constraints on low-memory systems
- Port conflicts (another process using port 3000)
- Missing `arkenv` build (dev server needs it for MDX type checking)

**Solutions**:
1. **Test build locally**: `pnpm run build --filter=www...` (builds www + dependencies)
2. **For CI failures**: Check build logs in earlier workflow steps
3. **Kill port 3000 processes**: `lsof -ti:3000 | xargs kill`
4. **Clear Next.js cache**: `pnpm --filter=www run clean`
5. **Verify production server starts**: `pnpm --filter=www run start` (should start in < 30s)

### Reporter and Artifacts

The test configuration uses different reporters for CI vs local:

- **CI**: `dot` reporter (concise) + HTML artifacts (saved, never opened)
- **Local**: `list` reporter (verbose) + HTML (opens on failure)

Videos and screenshots are captured **only on failure** to reduce artifact size.
