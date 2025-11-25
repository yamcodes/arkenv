# Design: Pluggable Logger Support

## Context

The Vite plugin currently uses ArkEnv's `ArkEnvError` which formats errors using ANSI color codes via `styleText`. Vite provides a built-in logger (using picocolors internally) that should be used for better integration with Vite's build output. The goal is to make the implementation minimal on the Vite plugin side while supporting pluggable loggers in the core library for future extensibility.

## Goals / Non-Goals

### Goals
- Support Vite's logger API for error formatting in the Vite plugin
- Maintain backward compatibility (logger is optional, defaults to current ANSI behavior)
- Keep Vite plugin implementation minimal (pass logger from Vite to core library)
- Design extensible logger interface for future logger support (e.g., other build tools)
- Zero new external dependencies

### Non-Goals
- Supporting all possible logger APIs (focus on Vite's logger first)
- Changing the error message format (only the styling mechanism changes)
- Adding logger support to browser environments (logger only applies in Node/build environments)

## Decisions

### Decision: Logger Abstraction Interface

**What**: Define a simple logger interface that accepts a color name and text, returning styled text.

**Why**: This abstraction allows plugging in different loggers (Vite's logger, future loggers) while keeping the core library decoupled from specific logger implementations.

**Alternatives considered**:
1. **Direct picocolors dependency**: Would add an external dependency and doesn't align with zero-dependency goal
2. **Pass full logger object**: Too complex, we only need the styling functionality
3. **No abstraction**: Would require custom code in Vite plugin, violating minimal implementation goal

**Implementation**:
```typescript
type LoggerStyle = (color: "red" | "yellow" | "cyan", text: string) => string;
```

### Decision: Optional Logger Parameter

**What**: Make logger parameter optional throughout the codebase, defaulting to current `styleText` behavior.

**Why**: Maintains backward compatibility and allows gradual adoption. Existing code continues to work without changes.

**Alternatives considered**:
1. **Required logger**: Would be a breaking change
2. **Global logger configuration**: Adds complexity and global state

**Implementation**: Logger is optional at all levels:
- `styleText(color, text, logger?)`
- `formatErrors(errors, logger?)`
- `ArkEnvError(errors, message?, logger?)`
- `createEnv(schema, env, logger?)`

### Decision: Vite Logger Adapter

**What**: Create a thin adapter function that converts Vite's logger API to our logger interface.

**Why**: Vite's logger has methods like `logger.error()`, `logger.warn()`, `logger.info()` that accept strings. We need to extract the styling functionality (picocolors) from these methods. The adapter provides a clean interface conversion.

**Alternatives considered**:
1. **Direct picocolors usage**: Would require adding picocolors as a dependency
2. **String manipulation**: Too fragile, doesn't leverage Vite's logger properly
3. **Custom logger implementation**: Defeats the purpose of using Vite's logger

**Implementation**: Adapter function in vite-plugin package that wraps Vite's logger:
```typescript
function createViteLoggerAdapter(logger: Logger): LoggerStyle {
  // Extract picocolors from Vite's logger
  // Return function matching LoggerStyle interface
}
```

### Decision: Error Formatting Flow

**What**: When validation fails in Vite plugin, catch the error, extract errors, and use Vite's logger to format and display them before failing the build.

**Why**: Follows Vite's best practices by using Vite's logger for build output. The error is still thrown to fail the build, but formatting uses Vite's logger.

**Alternatives considered**:
1. **Prevent error throwing**: Would require significant refactoring
2. **Custom error handling**: Doesn't use Vite's logger, violates minimal implementation goal

**Implementation**: 
- Vite plugin catches `ArkEnvError` or validation errors
- Extracts error information
- Uses Vite's logger to format and display errors
- Calls `this.error()` to fail the build with Rollup-style error

## Risks / Trade-offs

### Risk: Logger API Changes
**Mitigation**: The logger interface is simple and stable. Vite's logger API is unlikely to change significantly.

### Risk: Performance Impact
**Mitigation**: Logger is only used during error cases (validation failures), which are rare. No performance impact on successful builds.

### Trade-off: Abstraction Overhead
**Trade-off**: Adding abstraction layer adds some complexity, but enables future extensibility and keeps Vite plugin minimal.

**Mitigation**: The abstraction is simple (single function type) and well-documented.

## Migration Plan

1. **Phase 1**: Add logger support to core library (backward compatible)
   - Extend `styleText` to accept optional logger
   - Extend `formatErrors` and `ArkEnvError` to accept optional logger
   - Extend `createEnv` to accept optional logger
   - All changes are optional, defaults to current behavior

2. **Phase 2**: Implement Vite logger adapter
   - Create adapter function in vite-plugin package
   - Adapter converts Vite's logger to our logger interface

3. **Phase 3**: Update Vite plugin to use logger
   - Catch validation errors
   - Use Vite's logger (via adapter) to format errors
   - Display formatted errors using Vite's logger methods
   - Fail build with `this.error()`

4. **Testing**: 
   - Unit tests for logger adapter
   - Integration tests for Vite plugin with logger
   - Verify backward compatibility (no logger passed)

## Open Questions

- How to extract picocolors from Vite's logger? (May need to inspect Vite's logger implementation)
- Should we support other logger APIs in the future? (Yes, but out of scope for this change)

