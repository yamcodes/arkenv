/**
 * Client / default stub for `#arkenv/server-boot`.
 *
 * The Nuxt module aliases this specifier to the real boot-gate ensure on the
 * server and Nitro graphs only, so client bundles never import `@arkenv/core`.
 */
export function ensureBootGate(): void {}
