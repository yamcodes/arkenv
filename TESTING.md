# Testing Strategy

This project uses a focused testing approach that combines unit tests with integration tests that use examples as test fixtures.

## Testing Philosophy

**"Examples as Test Fixtures"** - Our examples serve dual purposes:
1. **Documentation** - Show real-world usage patterns
2. **Test Fixtures** - Provide real projects to test against

This approach ensures the library works in real scenarios while keeping examples clean and focused.

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

## Benefits of This Approach

1. **Clean Separation** - Examples remain pure examples, not test files
2. **Real-World Validation** - Plugin tests use actual Vite projects
3. **Low Maintenance** - Examples don't need test maintenance
4. **Focused Testing** - Each package tests its own functionality
5. **Integration Coverage** - Plugin tests catch real-world issues

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

This approach provides comprehensive test coverage while maintaining clean, focused examples.
