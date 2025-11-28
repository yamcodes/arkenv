# Copilot Instructions for ArkEnv

## Project Overview

ArkEnv is a TypeScript library that provides typesafe environment variable parsing and validation, powered by ArkType. It enables developers to define environment variable schemas with full TypeScript type inference and runtime validation.

### Key Features
- **Typesafe**: Full TypeScript support with inferred types  
- **Runtime validation**: Catch missing or invalid environment variables early
- **Powered by ArkType**: Leverage ArkType's powerful type system
- **Lightweight**: Zero external, tiny bundle size
- **Fast**: Optimized for performance with minimal overhead

## Repository Structure

This is a monorepo managed with pnpm workspaces and Turbo:

```
arkenv/
├── packages/
│   ├── arkenv/          # Core library
│   └── vite-plugin/     # Vite integration plugin
├── apps/
│   └── www/            # ArkEnv site (w/ documentation)
├── examples/           # Usage examples
│   ├── basic/          # Basic Node.js example
│   ├── with-bun/       # Bun runtime example
└── .github/            # GitHub workflows and configuration
```

## Development Setup

The project uses modern tooling:
- **pnpm**: Package manager with workspace support
- **Turbo**: Monorepo build system for fast, incremental builds
- **Biome**: Fast linting and formatting (replaces ESLint + Prettier)
- **Vitest**: Testing framework
- **TypeScript**: Primary language
- **Changesets**: Version management and changelog generation

### Common Commands
- `pnpm install` - Install dependencies
- `pnpm build` - Build all packages
- `pnpm build:packages` - Build only packages (not apps)
- `pnpm test` - Run tests with Vitest
- `pnpm check` - Run Biome linting
- `pnpm fix` - Auto-fix linting issues
- `pnpm changeset` - Create a changeset for version management

## Core Architecture

### Main Package (`packages/arkenv`)

The core package provides:

1. **`createEnv(schema)`** - Main function to create validated environment objects. Also available as the default export, typically imported as `arkenv`.
2. **Built-in validators** - Common validators like `host`, `port`, `url`, etc.
3. **ArkType integration** - Uses ArkType for schema definition and validation
4. **Type inference** - Full TypeScript type inference from schemas

### Key Files
- `src/create-env.ts` - Core `createEnv` implementation
- `src/types.ts` - Built-in type validators (host, port, url, etc.)
- `src/errors.ts` - Error handling and formatting
- `src/utils.ts` - Utility functions

## Coding Patterns

### Environment Schema Definition
```typescript
import arkenv from 'arkenv';

const env = arkenv({
  HOST: "string.host",                                    // Built-in validator
  PORT: "number.port",                                    // Built-in validator  
  NODE_ENV: "'development' | 'production' | 'test'", // ArkType string literal
  DATABASE_URL: "string",                        // Simple ArkType schema
  FEATURE_FLAG: "boolean = false",               // Default value
});
```

### Built-in Validators
The library provides common validators in `src/types.ts`:
- `host` - Valid IP address or hostname
- `port` - Valid port number (0-65535)
- `url` - Valid URL
- `email` - Valid email address

### Error Handling
Environment validation errors are thrown early with descriptive messages showing:
- Which variables are missing or invalid
- Expected vs actual values
- Helpful suggestions for fixing issues

## Testing Guidelines

### Test Structure

The project uses three types of tests:

#### Unit Tests (`*.test.ts` or `*.test.tsx`)
**What:** Test individual functions, components, and hooks in isolation with mocked dependencies.

Tests are located alongside source files with `.test.ts` suffix:
- `create-env.test.ts` - Tests for main `createEnv` functionality
- `types.test.ts` - Tests for built-in validators
- `errors.test.ts` - Tests for error handling
- `utils.test.ts` - Tests for utility functions
- `copy-button.test.tsx` - Tests `CopyButton` component with mocked dependencies

**Key Characteristics:**
- Fast execution (< 100ms per test)
- Mocked external dependencies (clipboard, network, etc.)
- Focused on single unit behavior

#### Integration Tests (`*.integration.test.ts` or `*.integration.test.tsx`)
**What:** Test how multiple units work together without mocking their interactions.

**Examples:**
- `custom-types.integration.test.ts` - Tests `createEnv` + `scope` + custom types working together
- `error.integration.test.ts` - Tests error propagation through validation pipeline
- `copy-button.integration.test.tsx` - Tests `CopyButton` + `useToast` + `Toaster` flow
- `heading.integration.test.tsx` - Tests `Heading` + `useIsMobile` responsive behavior
- `toaster.integration.test.tsx` - Tests `useToast` + `Toaster` state synchronization

**Key Characteristics:**
- Slower than unit tests (100ms - 2000ms per test)
- Real interactions between units (not mocked)
- External APIs still mocked (clipboard, network)
- Naming convention: `*.integration.test.ts` suffix

#### End-to-End Tests (`tooling/playwright-www/`)
**What:** Test complete user workflows in real browsers.

**Key Characteristics:**
- Slowest tests (multiple seconds)
- No mocking - tests real application
- Cross-browser compatibility testing

### Testing Patterns
- Use Vitest's `describe`/`it` structure
- Test both success and failure cases
- Mock `process.env` for testing different scenarios
- Verify both runtime behavior and TypeScript types

### Unit Test Example
```typescript
import { beforeEach, afterEach, it, expect } from 'vitest';

beforeEach(() => {
  // Save original env
  originalEnv = process.env;
});

afterEach(() => {
  // Restore original env
  process.env = originalEnv;
});

it('should validate environment variables', () => {
  process.env.PORT = '3000';
  const env = arkenv({ PORT: "number.port" });
  expect(env.PORT).toBe(3000);
});
```

### Integration Test Example
```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CopyButton } from "./copy-button";
import { Toaster } from "~/components/ui/toaster";

describe("CopyButton + useToast + Toaster integration", () => {
  it("should show toast when copy succeeds", async () => {
    const user = userEvent.setup();
    
    render(
      <>
        <CopyButton command="npm install arkenv" />
        <Toaster />
      </>
    );

    const button = screen.getByRole("button", { name: /copy command/i });
    await user.click(button);

    // Verify toast appears (integration between components)
    await waitFor(() => {
      expect(screen.getByText(/command copied to clipboard/i)).toBeInTheDocument();
    });
  });
});
```

### Running Tests
```bash
# Run all tests (unit + integration)
pnpm test -- --run

# Run only integration tests
pnpm test -- --run "integration"

# Run tests for specific package
pnpm test --project arkenv -- --run

# Run end-to-end tests
pnpm run test:e2e
```

## Contributing Workflow

1. **Development**: Make changes in feature branches
2. **Testing**: Ensure tests pass with `pnpm test`
3. **Linting**: Run `pnpm check` and fix issues with `pnpm fix`
4. **Changeset**: Create changeset with `pnpm changeset` for version bumps
5. **Documentation**: Update docs if adding new features
6. **Examples**: Add examples for new functionality

### Changeset Guidelines
- **patch**: Bug fixes, internal improvements
- **minor**: New features, new validators
- **major**: Breaking changes to API

## Plugin Development

### Vite Plugin (`packages/vite-plugin`)
The Vite plugin validates environment variables at build time:
- Integrates with Vite's build process
- Provides early validation feedback
- Supports development and production builds

## Performance Considerations

- Environment validation happens once at startup
- Schemas are compiled for efficient validation
- Minimal runtime overhead after initial validation
- Tree-shakable exports for optimal bundle size

## Common Issues & Solutions

### Missing Environment Variables
The library provides clear error messages with:
- List of missing variables
- Expected types/formats
- Suggestions for `.env` file setup

### Type Inference Issues
- Ensure ArkType schemas are properly typed
- Use built-in validators when possible
- Check TypeScript version compatibility

### Build Issues
- Run `pnpm build:packages` for library builds
- Use `turbo run build` for full monorepo builds
- Check for TypeScript errors with `pnpm typecheck`

## Best Practices

1. **Use built-in validators** when available (host, port, url, etc.)
2. **Provide defaults** for optional environment variables
3. **Group related variables** in logical schemas
4. **Document environment requirements** in README files
5. **Test edge cases** including invalid and missing values
6. **Use descriptive variable names** that indicate purpose and format

## Examples Reference

Check the `examples/` directory for practical usage patterns:
- `basic/` - Simple Node.js application
- `with-bun/` - Bun runtime integration

These examples demonstrate real-world usage and can serve as templates for new integrations.