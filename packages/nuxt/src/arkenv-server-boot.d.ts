/**
 * Ambient fallback for the `#arkenv/server-boot` virtual module.
 *
 * `@arkenv/nuxt/module` aliases this to the real boot-gate ensure on server/Nitro
 * graphs and to a no-op stub on the client, so client bundles never import core.
 */
declare module "#arkenv/server-boot" {
	/**
	 * Ensure the Nitro boot gate has run (no-op on the client stub).
	 */
	export function ensureBootGate(): void;
}
