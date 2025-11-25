## 1. Package Setup

- [ ] 1.1 Create `packages/bun-plugin/` directory structure
- [ ] 1.2 Initialize package.json with proper metadata and peer dependencies (bun, arkenv, arktype)
- [ ] 1.3 Set up TypeScript configuration (tsconfig.json)
- [ ] 1.4 Set up build configuration (tsdown.config.ts or similar)
- [ ] 1.5 Add package to pnpm workspace
- [ ] 1.6 Configure changeset for the new package

## 2. Core Plugin Implementation

- [ ] 2.1 Implement main plugin function that accepts schema (similar to Vite plugin signature)
- [ ] 2.2 Implement `onLoad` hook to intercept module loading
- [ ] 2.3 Add logic to detect and transform `process.env.VARIABLE` patterns
- [ ] 2.4 Integrate ArkEnv's `createEnv` for validation and transformation
- [ ] 2.5 Implement filtering logic to only expose variables matching Bun's prefix (defaults to `BUN_PUBLIC_*`)
- [ ] 2.6 Handle static replacement of `process.env` variables with validated values
- [ ] 2.7 Add support for Bun's prefix configuration (read from bunfig.toml or use default)

## 3. Type Augmentation

- [ ] 3.1 Create `ProcessEnvAugmented<TSchema, Prefix>` type utility
- [ ] 3.2 Implement filtering logic to only include prefixed variables in type
- [ ] 3.3 Export type from plugin package
- [ ] 3.4 Add JSDoc documentation with usage examples

## 4. Testing

- [ ] 4.1 Add unit tests for plugin function
- [ ] 4.2 Add integration tests using Bun React playground as fixture
- [ ] 4.3 Test environment variable validation and error handling
- [ ] 4.4 Test filtering behavior (only prefixed variables exposed)
- [ ] 4.5 Test type augmentation (TypeScript compilation tests)
- [ ] 4.6 Test various `process.env` access patterns (direct access, destructuring, optional chaining)
- [ ] 4.7 Test with Bun's serve function in full-stack React app

## 5. Documentation

- [ ] 5.1 Create README.md for the package with installation and usage instructions
- [ ] 5.2 Add documentation page to www app (docs/bun-plugin/)
- [ ] 5.3 Document type augmentation pattern (similar to Vite plugin docs)
- [ ] 5.4 Add examples showing common usage patterns
- [ ] 5.5 Document Bun prefix configuration and filtering behavior
- [ ] 5.6 Add troubleshooting section

## 6. Examples and Playgrounds

- [ ] 6.1 Update Bun React playground to use the plugin
- [ ] 6.2 Add example showing environment variable validation
- [ ] 6.3 Add example showing type augmentation setup
- [ ] 6.4 Verify playground builds and runs correctly with plugin

## 7. Validation

- [ ] 7.1 Run `openspec validate add-bun-plugin --strict`
- [ ] 7.2 Verify all tests pass
- [ ] 7.3 Verify TypeScript compilation succeeds
- [ ] 7.4 Verify playground examples work correctly
- [ ] 7.5 Check bundle size meets project constraints (<2kB goal)

