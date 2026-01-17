# Dependency Notes

## React 19 Compatibility

### @radix-ui/react-popover

**Current Version:** ^1.1.15  
**Status:** ⚠️ Lacks official React 19 support

The `@radix-ui/react-popover` package currently declares peer dependencies for React ^16.8.0 || ^17 || ^18, and does not officially support React 19.2.3 used in this repository.

**Current approach:**
- Runtime testing has verified that the package functions correctly with React 19.
- The peer dependency warning can be safely ignored until Radix UI releases an official React 19 compatible version.

**Future action:**
- Monitor Radix UI releases for official React 19 support
- Upgrade `@radix-ui/react-popover` when a React 19 compatible version is available
