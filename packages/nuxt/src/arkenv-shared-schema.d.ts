/**
 * Ambient fallback for the `#arkenv/shared-schema` virtual module.
 *
 * In Nuxt strict layout, `@arkenv/nuxt/module` aliases this specifier to the
 * project's `env/internal/shared.ts`, so consumer TypeScript resolves the real
 * `SharedSchema` type. Outside that wiring, `SharedSchema` stays empty (and is
 * augmentable in tests) so package typechecks remain green.
 */
declare module "#arkenv/shared-schema" {
	// biome-ignore lint/style/useConsistentTypeDefinitions: declaration merging requires an interface
	interface SharedSchemaShape {}
	export const SharedSchema: SharedSchemaShape;
}
