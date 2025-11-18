## 1. Solution Evaluation and Implementation

- [x] 1.1 Evaluate potential solutions for schema/typing availability challenge:
  - [x] 1.1.1 Factory pattern (`createArkEnv()` returning both `loadEnv` and `vitePlugin()`) - Evaluated, not chosen
  - [x] 1.1.2 Schema defined outside `defineConfig` and used in both places - **CHOSEN**
  - [x] 1.1.3 Centralized env file (`src/env.ts`) with type imports - Evaluated, not chosen
  - [x] 1.1.4 Type augmentation approach (similar to vite-plugin-validate-env) - Evaluated, not chosen
- [x] 1.2 Choose and implement the selected solution approach
  - [x] Modified `createEnv()` to accept both raw schema objects and type definitions created with `type()`
  - [x] Implemented proper type inference for type definitions using `InferType<T>` helper
  - [x] Modified vite plugin to accept both raw schema objects and type definitions
  - [x] Updated vite.config.ts example to use `type()` to define schema once, outside `defineConfig`
  - [x] Verified type inference works correctly - `env` is properly typed (not `unknown`)
- [x] 1.3 If implementing a `loadEnv` wrapper, ensure it provides type-safe return values
  - Not needed - `createEnv` directly accepts type definitions, no wrapper required
- [x] 1.4 Ensure the solution allows schema to be shared between `loadEnv` call and plugin definition
  - Schema defined with `type()` outside `defineConfig` can be reused in both places
- [ ] 1.5 Add tests for the implemented solution

## 2. Documentation

- [ ] 2.1 Add section to `packages/arkenv/README.md` about using ArkEnv in vite.config.ts with unprefixed variables
- [ ] 2.2 Create or update documentation page for Vite config usage
- [ ] 2.3 Clearly document distinction between server-only (config) and client-exposed (`VITE_*`) env vars
- [ ] 2.4 Add examples showing common patterns (server config, build settings, etc.)
- [ ] 2.5 Document usage with Vite's `loadEnv` function

## 3. Examples

- [x] 3.1 Update `apps/playgrounds/vite/vite.config.ts` to demonstrate ArkEnv usage for unprefixed config variables
- [x] 3.2 Add example showing validation of server port, proxy settings, or other Vite config env vars using `loadEnv`
- [x] 3.3 Ensure examples clearly distinguish config env vars from client env vars
- [x] 3.4 Ensure examples are clear and follow best practices

## 4. Testing

- [ ] 4.1 Add test case verifying ArkEnv works in vite.config.ts context with `loadEnv`
- [ ] 4.2 Test error handling when config env vars are invalid
- [ ] 4.3 Verify type safety in vite.config.ts examples
- [ ] 4.4 Test the loadEnv wrapper utility (if implemented)

## 5. Validation

- [ ] 5.1 Run `openspec validate add-arkenv-vite-config --strict`
- [ ] 5.2 Verify all examples work correctly
- [ ] 5.3 Check that documentation is clear and complete
- [ ] 5.4 Ensure examples demonstrate the distinction between config and client env vars

