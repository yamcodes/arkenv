## 1. Implementation

- [x] 1.1 Modify plugin to access Vite's `envPrefix` from config (default to `"VITE_"`)
- [x] 1.2 Validate all environment variables against the schema
- [x] 1.3 Filter validated results to expose only variables matching the configured prefix
- [x] 1.4 Update plugin implementation in `packages/vite-plugin/src/index.ts`

## 2. Testing

- [x] 2.1 Add unit test for prefix filtering (default `VITE_` prefix)
- [x] 2.2 Add unit test for custom `envPrefix` configuration
- [x] 2.3 Add test to verify server-only variables are NOT exposed
- [x] 2.4 Add test to verify only prefixed variables ARE exposed
- [x] 2.5 Update existing tests if needed
- [x] 2.6 Test with the vite playground example to verify fix

## 3. Documentation

- [x] 3.1 Update plugin documentation to explain filtering behavior
- [x] 3.2 Update `vite.config.ts` example comments to reflect actual behavior
- [x] 3.3 Update any other documentation referencing plugin behavior

## 4. Validation

- [x] 4.1 Verify the fix prevents `PORT` from being exposed in vite playground
- [x] 4.2 Run all existing tests to ensure no regressions
- [x] 4.3 Validate proposal with `openspec validate fix-vite-plugin-env-filter --strict`

