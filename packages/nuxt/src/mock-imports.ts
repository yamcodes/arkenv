/**
 * Resolve Nuxt runtime config in tests.
 *
 * Prefer `globalThis.__mockRuntimeConfig` when set by a test; otherwise return
 * an empty public config so schema validation can fall through to `process.env`.
 *
 * @returns The mocked Nuxt runtime config object
 */
export function useRuntimeConfig(): any {
	if ((globalThis as any).__mockRuntimeConfig) {
		return (globalThis as any).__mockRuntimeConfig;
	}
	return {
		public: {},
	};
}
