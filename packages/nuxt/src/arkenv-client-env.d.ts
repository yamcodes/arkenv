/**
 * Ambient fallback for the `#arkenv/client-env` virtual module.
 *
 * In Nuxt strict layout, `@arkenv/nuxt/module` aliases this specifier to the
 * project's `env/client.ts`, so consumer TypeScript resolves the real `env`
 * type. Outside that wiring, `ClientEnv` stays empty (and is augmentable in
 * tests) so package typechecks remain green.
 */
declare module "#arkenv/client-env" {
	// biome-ignore lint/style/useConsistentTypeDefinitions: declaration merging requires an interface
	interface ClientEnv {}
	export const env: ClientEnv;
}
