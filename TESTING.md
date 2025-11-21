# Testing Strategy

This project uses a comprehensive testing approach that combines unit tests, integration tests, and end-to-end tests to ensure reliability across all layers.

## Testing Philosophy

**"Examples as Test Fixtures"** - Examples serve dual purposes:
1. **Documentation** - Show real-world usage patterns
2. **Test Fixtures** - Provide real projects to test against

**"Test the User Journey"** - End-to-end tests validate complete user workflows in real applications.

This ensures the library works in real scenarios while keeping examples clean and validating user experiences.

## Component Testing Philosophy

**Test behavior, not aesthetics.** Focus on what users can do and what the component guarantees through its API.

### What We Test
- **Public API** - props, events, and component contract
- **User behavior** - clicks, typing, focus, keyboard, ARIA
- **State transitions** - loading, success, error, disabled states
- **Accessibility** - focus order, keyboard activation, aria attributes
- **Side effects** - UI changes that affect user experience

### What We Don't Test
- Pure styling or CSS classes
- Library internals (Radix/shadcn/MUI)
- Implementation details (hooks, setState, private variables)
- Visual variants (use Storybook instead)

### Testing Rules
- Use Testing Library + user-event for real user simulation
- Query by role, name, label, and text (accessibility first)
- Mock at component boundaries (network, time, context)
- Keep tests fast, deterministic, and parallelizable
- Co-locate tests: `Component.tsx` next to `Component.test.tsx`

## Test Structure

### Unit Tests (`*.test.ts` or `*.test.tsx`)
**What:** Test individual functions, components, and hooks in isolation with mocked dependencies.

**Focus:**
- Individual function logic and edge cases
- Component rendering and props
- Error handling and validation
- Type checking

**Examples:**
- `create-env.test.ts` - Tests `createEnv` function with mocked environment variables
- `copy-button.test.tsx` - Tests `CopyButton` component with mocked clipboard and toast
- `use-toast.test.ts` - Tests `useToast` hook in isolation

**Key Characteristics:**
- Fast execution (< 100ms per test)
- Mocked external dependencies (clipboard, network, etc.)
- Focused on single unit behavior

### Integration Tests (`*.integration.test.ts` or `*.integration.test.tsx`)
**What:** Test how multiple units (components, hooks, functions) work together without mocking their interactions.

**Focus:**
- Component + Hook interactions
- Function composition and data flow
- Real dependencies between units
- State synchronization across boundaries

**Examples:**
- `custom-types.integration.test.ts` - Tests `createEnv` + `scope` + custom types working together
- `error.integration.test.ts` - Tests error propagation through `createEnv` + `formatErrors` + `ArkEnvError`
- `copy-button.integration.test.tsx` - Tests `CopyButton` + `useToast` + `Toaster` as a complete flow
- `heading.integration.test.tsx` - Tests `Heading` + `useIsMobile` responding to viewport changes
- `toaster.integration.test.tsx` - Tests `useToast` hook + `Toaster` component state synchronization

**Key Characteristics:**
- Slower than unit tests (100ms - 2000ms per test)
- Real interactions between units (not mocked)
- External APIs still mocked (clipboard, network)
- Verifies integration contracts

**Naming Convention:** Use `*.integration.test.ts` suffix to distinguish from unit tests.

### Vite Plugin Tests (`packages/vite-plugin/src/*.test.ts`)
**What:** Fixture-based tests using real example projects.

**Focus:**
- Plugin integration with Vite
- Environment variable loading and injection
- Build-time validation

**Key Characteristics:**
- Uses real example projects as test fixtures
- Validates complete build process
- Ensures plugin works in real-world scenarios

### End-to-End Tests (`tooling/playwright-www/`)
**What:** Test complete user workflows in the www application using real browsers.

**Focus:**
- Complete user journeys in production-like environments
- Real browser behavior across Chromium, Firefox, and WebKit
- Visual rendering and interactions
- Network requests and loading states

**Key Characteristics:**
- Slowest tests (multiple seconds per test)
- No mocking - tests real application
- Cross-browser compatibility testing
- Catches issues that unit and integration tests might miss

## Running Tests

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

# Run end-to-end tests
pnpm run test:e2e

# Run e2e tests with UI
pnpm run test:e2e:ui

# Run e2e tests in headed mode
pnpm run test:e2e:headed
```

## Test Coverage

### Core Package (`arkenv`)

**Unit Tests:**
- ✅ Environment variable parsing and validation
- ✅ Type checking and error handling
- ✅ Default value handling
- ✅ Custom type validation (host, port, etc.)
- ✅ Individual function behavior

**Integration Tests:**
- ✅ Custom types working with `createEnv` (`custom-types.integration.test.ts`)
- ✅ Error propagation through validation pipeline (`error.integration.test.ts`)
- ✅ Array defaults with type validation (`array-defaults.integration.test.ts`)

### Vite Plugin (`@arkenv/vite-plugin`)
- ✅ Plugin integration with Vite
- ✅ Environment variable loading and injection
- ✅ Real project build testing using the example as a fixture
- ✅ Error handling for missing environment variables

### WWW Application (`apps/www`)

**Unit Tests:**
- ✅ Individual component rendering and behavior
- ✅ Hook functionality in isolation
- ✅ Utility functions and helpers

**Integration Tests:**
- ✅ CopyButton + useToast + Toaster workflow (`copy-button.integration.test.tsx`)
- ✅ Heading + useIsMobile responsive behavior (`heading.integration.test.tsx`)
- ✅ useToast + Toaster state synchronization (`toaster.integration.test.tsx`)

**End-to-End Tests:**
- ✅ Application loads correctly across all browsers
- ✅ Basic HTML structure validation
- ✅ Console error monitoring and reporting
- ✅ Screenshot capture for visual verification
- ✅ Cross-browser compatibility (Chromium, Firefox, WebKit)

## Examples

Examples are kept clean and focused on demonstrating usage:
- `examples/basic` - Basic Node.js usage
- `examples/with-bun` - Bun runtime usage  

## CI Integration

The CI pipeline runs:
- Unit tests for core functionality
- Integration tests for the Vite plugin using real examples
- End-to-end tests for the www application across multiple browsers
- Ensures no regressions in real-world usage scenarios
- Validates complete user journeys in production-like environments
