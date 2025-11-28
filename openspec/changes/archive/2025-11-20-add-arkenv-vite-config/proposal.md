# Change: Add ArkEnv in ViteConfig

## Why

There's no clear documentation on how to use ArkEnv for non-prefixed environment variables (e.g., `PORT`, database credentials) in `vite.config.ts`. By default, Vite only exposes `VITE_`-prefixed variables to client code, but `vite.config.ts` often needs access to unprefixed variables for server-side configuration (server port, build settings, proxy configuration, etc.).

This creates a gap where:
- Users might manually access `process.env` in vite.config.ts without validation
- Configuration errors are discovered late (at runtime) rather than at build-time
- No type safety for environment variables used in Vite config
- Confusion between server-only (config) and client-exposed (`VITE_*`) environment usage

**Related Issue**: [#365](https://github.com/yamcodes/arkenv/issues/365)

## Architectural Challenge

There's a key challenge: the schema AND typing need to be available in both:
1. The `plugins` section of `defineConfig` (for the `@arkenv/vite-plugin` to validate `VITE_*` variables)
2. Around the `loadEnv` call (for validating unprefixed config variables like `PORT`)

The problem is that `loadEnv` is typically called before the plugin is defined, making it difficult to share the schema and typing between both use cases. Additionally, Vite's flow may not allow applying plugins before `loadEnv` is used.

**Potential Solutions** (to be evaluated during implementation):

1. **Factory Pattern**: Create a factory function that returns both a `loadEnv` wrapper and the plugin:
   ```ts
   const arkenv = createArkEnv({ PORT: "number.port", VITE_MY_VAR: "string" });
   const env = arkenv.loadEnv(mode, process.cwd(), "");
   // Use arkenv.vitePlugin() in plugins array
   ```

2. **Schema Outside Config**: Define the schema outside `defineConfig` and use it in both places:
   ```ts
   const Env = type({ PORT: "number.port", VITE_MY_VAR: "string" });
   // Use Env in both loadEnv and plugin
   ```

3. **Centralized Env File**: Define envs in `src/env.ts` and import types from there:
   ```ts
   // src/env.ts
   export const env = arkenv({ PORT: "number.port", ... });
   
   // vite.config.ts
   const env = loadEnv<typeof import('./src/env').env>(mode, process.cwd(), "");
   ```

4. **Type Augmentation**: Use clever TypeScript trickery to infer types dynamically (similar to [vite-plugin-validate-env](https://github.com/Julien-R44/vite-plugin-validate-env#typing-importmetaenv))

## What Changes

- **ADDED**: Documentation and examples for using ArkEnv directly in `vite.config.ts` with unprefixed variables
- **ADDED**: Solution for sharing schema/typing between `loadEnv` call and plugin definition
- **ADDED**: Potentially wrap Vite's `loadEnv` function with ArkEnv transformations and typing
- **ADDED**: Clear distinction between server-only (config) and client-exposed (`VITE_*`) environment usage patterns
- **ADDED**: Typesafe access to environment variables in Vite config files
- **ADDED**: Example usage demonstrating the pattern

This change focuses on:
1. Evaluating and implementing a solution for the schema/typing availability challenge
2. Documenting the pattern of using `arkenv()` or `createEnv()` with Vite's `loadEnv()` in vite.config.ts
3. Potentially providing a helper that wraps `loadEnv` with ArkEnv validation
4. Ensuring The core package works seamlessly in Vite config context
5. Providing examples and best practices that distinguish config vs client env vars

## Impact

- **Affected specs**: New capability `vite-config-usage`
- **Affected code**: 
  - Documentation files (README, docs)
  - Example vite.config.ts files
  - Potentially `@arkenv/vite-plugin` if we add a `loadEnv` wrapper utility
- **User-facing**: Users can now validate unprefixed environment variables in vite.config.ts with full type safety

## References

- [GitHub Issue #365](https://github.com/yamcodes/arkenv/issues/365) - Original feature request and architectural discussion
- [Vite: Using Environment Variables in Config](https://vite.dev/config/#using-environment-variables-in-config) - Official Vite documentation on using env vars in config files
- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html) - Vite's general env var handling
- Related: [Issue #195](https://github.com/yamcodes/arkenv/issues/195) - Vite TypeScript env var type inference
- [vite-plugin-validate-env](https://github.com/Julien-R44/vite-plugin-validate-env#typing-importmetaenv) - Reference for type augmentation approach

