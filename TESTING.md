# Testing Strategy

This project uses focused testing that combines unit tests with integration tests using examples as fixtures.

## Testing Philosophy

**"Examples as Test Fixtures"** - Examples serve dual purposes:
1. **Documentation** - Show real-world usage patterns
2. **Test Fixtures** - Provide real projects to test against

This ensures the library works in real scenarios while keeping examples clean.

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

### Unit Tests (`packages/arkenv/src/*.test.ts`)
- Test individual functions and edge cases
- Validate error handling and type checking
- Fast, isolated tests for core logic

### Integration Tests (`packages/vite-plugin/src/*.test.ts`)
- Test the vite plugin using the `with-vite-react-ts` example as a fixture
- Validate that the plugin works with real Vite projects
- Ensure environment variable injection works correctly

## Running Tests

```bash
# Run all tests
pnpm test -- --run

# Run only unit tests
pnpm test --project arkenv -- --run

# Run only vite plugin tests
pnpm test --project vite-plugin -- --run
```

## Test Coverage

### Core Package (`arkenv`)
- ✅ Environment variable parsing and validation
- ✅ Type checking and error handling
- ✅ Default value handling
- ✅ Custom type validation (host, port, etc.)

### Vite Plugin (`@arkenv/vite-plugin`)
- ✅ Plugin integration with Vite
- ✅ Environment variable loading and injection
- ✅ Real project build testing using the example as a fixture
- ✅ Error handling for missing environment variables

## Examples

Examples are kept clean and focused on demonstrating usage:
- `examples/basic` - Basic Node.js usage
- `examples/with-bun` - Bun runtime usage  
- `examples/with-vite-react-ts` - Vite plugin usage (also used as test fixture)

## CI Integration

The CI pipeline runs:
- Unit tests for core functionality
- Integration tests for the vite plugin using real examples
- Ensures no regressions in real-world usage scenarios
