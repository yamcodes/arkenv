## 1. Implementation

- [ ] 1.1 Modify plugin to access Vite's `envPrefix` from config (default to `"VITE_"`)
- [ ] 1.2 Filter schema keys to only include those matching the prefix
- [ ] 1.3 Update plugin to validate and expose only filtered variables
- [ ] 1.4 Update plugin implementation in `packages/vite-plugin/src/index.ts`

## 2. Testing

- [ ] 2.1 Add unit test for prefix filtering (default `VITE_` prefix)
- [ ] 2.2 Add unit test for custom `envPrefix` configuration
- [ ] 2.3 Add test to verify server-only variables are NOT exposed
- [ ] 2.4 Add test to verify only prefixed variables ARE exposed
- [ ] 2.5 Update existing tests if needed
- [ ] 2.6 Test with the vite playground example to verify fix

## 3. Documentation

- [ ] 3.1 Update plugin documentation to explain filtering behavior
- [ ] 3.2 Update `vite.config.ts` example comments to reflect actual behavior
- [ ] 3.3 Update any other documentation referencing plugin behavior

## 4. Validation

- [ ] 4.1 Verify the fix prevents `PORT` from being exposed in vite playground
- [ ] 4.2 Run all existing tests to ensure no regressions
- [ ] 4.3 Validate proposal with `openspec validate fix-vite-plugin-env-filter --strict`

