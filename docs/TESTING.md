# Testing strategy

This project uses a comprehensive testing approach that combines unit tests, integration tests, and end-to-end tests to ensure reliability across all layers.

## Testing philosophy

**"Examples as Test Fixtures"** - Examples serve dual purposes:

1. **Documentation** - Show real-world usage patterns
2. **Test Fixtures** - Provide real projects to test against

**"Test the User Journey"** - End-to-end tests validate complete user workflows in real applications.

This ensures the library works in real scenarios while keeping examples clean and validating user experiences.

## Component testing philosophy

**Test behavior, not aesthetics.** Focus on what users can do and what the component guarantees through its API.

### What we test

- **Public API** - props, events, and component contract
- **User behavior** - clicks, typing, focus, keyboard, ARIA
- **State transitions** - loading, success, error, disabled states
- **Accessibility** - focus order, keyboard activation, aria attributes
- **Side effects** - UI changes that affect user experience

### What we don't test

- Pure styling or CSS classes
- Library internals (Radix/shadcn/MUI)
- Implementation details (hooks, setState, private variables)
- Visual variants (use Storybook instead)

### Testing rules

- Use Testing Library + user-event for real user simulation
- Query by role, name, label, and text (accessibility first)
- Mock at component boundaries (network, time, context)
- Keep tests fast, deterministic, and parallelizable
- Co-locate tests: `Component.tsx` next to `Component.test.tsx`

## Test structure

### Unit tests (`*.test.ts` or `*.test.tsx`)

**What:** Test individual functions, components, and hooks in isolation with mocked dependencies.

**Focus:**

- Individual function logic and edge cases
- Component rendering and props
- Error handling and validation
- Type checking

**Examples:**

- `arkenv.test.ts` - Tests `arkenv` function with mocked environment variables
- `copy-button.test.tsx` - Tests `CopyButton` component with mocked clipboard and toast
- `use-toast.test.ts` - Tests `useToast` hook in isolation

**Key Characteristics:**

- Fast execution (\< 100ms per test)
- Mocked external dependencies (clipboard, network, etc.)
- Focused on single unit behavior

### Integration tests (`*.integration.test.ts` or `*.integration.test.tsx`)

**What:** Test how multiple units (components, hooks, functions) work together without mocking their interactions.

**Focus:**

- Component + Hook interactions
- Function composition and data flow
- Real dependencies between units
- State synchronization across boundaries

**Examples:**

- `custom-types.integration.test.ts` - Tests `arkenv` + `scope` + custom types working together
- `error.integration.test.ts` - Tests error propagation through `arkenv` + `formatErrors` + `ArkEnvError`
- `copy-button.integration.test.tsx` - Tests `CopyButton` + `useToast` + `Toaster` as a complete flow
- `heading.integration.test.tsx` - Tests `Heading` + `useIsMobile` responding to viewport changes
- `toaster.integration.test.tsx` - Tests `useToast` hook + `Toaster` component state synchronization

**Key Characteristics:**

- Slower than unit tests (100ms - 2000ms per test)
- Real interactions between units (not mocked)
- External APIs still mocked (clipboard, network)
- Verifies integration contracts

**Naming Convention:** Use `*.integration.test.ts` suffix to distinguish from unit tests.

### Vite plugin tests (`packages/vite-plugin/src/*.test.ts`)

**What:** Fixture-based tests using real example projects.

**Focus:**

- Plugin integration with Vite
- Environment variable loading and injection
- Build-time validation

**Key Characteristics:**

- Uses real example projects as test fixtures
- Validates complete build process
- Ensures plugin works in real-world scenarios

### End-to-end tests (`apps/playwright-www/`)

**What:** Test complete user workflows in the www application using real browsers.

**Focus:**

- **Interactive Behaviors**: Testing actual user interactions (clicks, navigation, form submission)
- **Security Invariants**: Verifying external links have correct `target` and `rel` attributes
- **System Behaviors**: No hydration errors, no console errors, no horizontal overflow on mobile
- **API Contracts**: Search endpoints respond correctly, 404 pages render
- **Accessibility**: ARIA attributes, keyboard navigation, semantic HTML structure

**What We Don't Test:**

- Specific documentation content (changes frequently, covered by review)
- CSS class names or styling details (implementation details)
- Exact wording of headings or descriptions (brittle, low value)

**Key Characteristics:**

- Slowest tests (multiple seconds per test)
- No mocking - tests real application
- Cross-browser compatibility testing
- Focused on user journeys and behavioral invariants

### Distribution tests (`packages/arkenv/test/dist.test.ts`)

**What:** Run a subset of assertions directly against the compiled library output (`dist/`).

**Focus:**

- Verifying that all three package tiers (`arkenv`, `arkenv/standard`, and `arkenv/core`) load and execute correctly.
- Catching broken relative paths or incorrect exports in the build config.

**Key Characteristics:**

- Imports directly from `dist/` rather than `src/` to validate bundled code.
- Automatically builds the package if `dist/` is not present during local testing.

### Package-level E2E tests (`scripts/test-e2e-package.js`)

**What:** Verify clean-room package installation behavior of the built tarball in example fixtures.

**Focus:**

- Recreating real-world user installations by packaging the monorepo output and installing the `.tgz` tarball.
- Verifying standard-schema validator integrations function correctly without having optional peer dependencies (`arktype`) installed.

**Key Characteristics:**

- Creates isolated temporary test directories outside the workspace (`os.tmpdir()`).
- Simulates complete offline dependency installations and execution of start scripts.

### Static artifact verification (`scripts/verify-artifacts.js`)

**What:** Programmatically verify distribution output constraints.

**Focus:**

- Inspecting built ESM and CJS files to ensure no forbidden dependency imports.
- Ensuring the `standard` and `core` tiers do not import or require the `arktype` library.
- Executing bundle size budget verifications using `size-limit`.

## Running tests

```bash
# Run all tests (unit + integration)
pnpm test -- --run

# Run only unit tests (arkenv package)
pnpm test --project arkenv -- --run

# Run only integration tests (across all packages)
pnpm test -- --run "integration"

# Run integration tests for specific package
pnpm test --project arkenv -- --run "integration"
pnpm test --project arkenv.js.org -- --run "integration"

# Run only Vite plugin tests
pnpm test --project vite-plugin -- --run

# Run only CLI tests
pnpm test --project cli -- --run

# Run end-to-end tests
pnpm run test:e2e

# Run e2e tests with UI
pnpm run test:e2e:ui

# Run e2e tests in headed mode
pnpm run test:e2e:headed

# Run only distribution tests
pnpm --filter arkenv test:dist

# Verify build artifacts and run static analysis checks
pnpm run verify-artifacts

# Run package-level E2E installation tests
pnpm run test:e2e:package
```

## Test coverage

### Core package (`arkenv`)

**Unit Tests:**

- ✅ Environment variable parsing and validation
- ✅ Type checking and error handling
- ✅ Default value handling
- ✅ Custom type validation (host, port, etc.)
- ✅ Individual function behavior

**Integration Tests:**

- ✅ Custom types working with `arkenv` (`custom-types.integration.test.ts`)
- ✅ Error propagation through validation pipeline (`error.integration.test.ts`)
- ✅ Array defaults with type validation (`array-defaults.integration.test.ts`)

**Distribution Tests:**

- ✅ Module loading and runtime validation of `dist/` artifacts (`dist.test.ts`)

### Vite plugin (`@arkenv/vite-plugin`)

- ✅ Plugin integration with Vite
- ✅ Environment variable loading and injection
- ✅ Real project build testing using the example as a fixture
- ✅ Error handling for missing environment variables

### CLI package (`arkenv`)

- ✅ Environment template selection by validator (`arktype`, `zod`, `valibot`)
- ✅ Framework and package manager detection heuristics
- ✅ Scaffolding file generation and overwrite handling via temp fixtures
- ✅ tsconfig strict-mode status detection and automatic updates
- ✅ Dependency installation command composition and failure handling
- ✅ Process-level smoke tests for `--help` and invalid command behavior

### WWW application (`apps/www`)

**Unit Tests:**

- ✅ Individual component rendering and behavior
- ✅ Hook functionality in isolation
- ✅ Utility functions and helpers

**Integration Tests:**

- ✅ CopyButton + useToast + Toaster workflow (`copy-button.integration.test.tsx`)
- ✅ Heading + useIsMobile responsive behavior (`heading.integration.test.tsx`)
- ✅ useToast + Toaster state synchronization (`toaster.integration.test.tsx`)

**End-to-End Tests:**

- ✅ All critical routes load successfully
- ✅ No console errors across top routes
- ✅ Accessibility compliance (a11y scans)
- ✅ Interactive components (homepage CTAs, video demo, search, docs switcher)
- ✅ Security attributes on external links
- ✅ Responsive design (no horizontal overflow on mobile)
- ✅ Theme switching (no hydration errors)
- ✅ 404 page navigation
- ✅ Cross-browser compatibility (Chromium, Firefox, WebKit)

## Examples

Examples are kept clean and focused on demonstrating usage:

- `examples/basic` - Basic Node.js usage
- `examples/with-bun` - Bun runtime usage

## Ci integration

The CI pipeline runs:

- Unit tests for core functionality and built outputs
- Static artifact verification to ensure standard/core remain dependency-free
- Clean-room E2E package installation tests across standard and core tiers
- Integration tests for the Vite plugin using real examples
- End-to-end tests for the www application across multiple browsers
- Ensures no regressions in real-world usage scenarios
- Validates complete user journeys in production-like environments
