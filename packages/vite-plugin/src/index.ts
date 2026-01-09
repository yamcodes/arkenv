import type { EnvSchemaWithType, SchemaShape } from "@repo/types";
import { arkenv, type EnvSchema } from "arkenv";
import { loadEnv, type Plugin } from "vite";

export type { ImportMetaEnvAugmented } from "./types";

/**
 * TODO: If possible, find a better type than "const T extends SchemaShape",
 * and be as close as possible to the type accepted by ArkType's `type`.
 */

/**
 * Vite plugin to validate environment variables using ArkEnv and expose them to client code.
 *
 * The plugin validates environment variables using ArkEnv's schema validation and
 * automatically filters them based on Vite's `envPrefix` configuration (defaults to `"VITE_"`).
 * Only environment variables matching the prefix are exposed to client code via `import.meta.env.*`.
 *
 * @param options - The environment variable schema definition as an object mapping environment keys to validators.
 * @returns A Vite plugin that validates environment variables and exposes them to the client.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import arkenv from '@arkenv/vite-plugin';
 *
 * export default defineConfig({
 *   plugins: [
 *     arkenv({
 *       VITE_API_URL: 'string',
 *       VITE_API_KEY: 'string',
 *     }),
 *   ],
 * });
 * ```
 *
 * @example
 * ```ts
 * // In your client code
 * console.log(import.meta.env.VITE_API_URL); // Typesafe access
 * ```
 */
export default function arkenv(options: EnvSchemaWithType): Plugin;
export default function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T>,
): Plugin;
export default function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T> | EnvSchemaWithType,
): Plugin {
	return {
		name: "@arkenv/vite-plugin",
		config(config, { mode }) {
			// Get the Vite prefix for client-exposed environment variables
			// Defaults to "VITE_" if not specified
			// Vite allows envPrefix to be a string or array of strings
			const envPrefix = config.envPrefix ?? "VITE_";
			const prefixes = Array.isArray(envPrefix) ? envPrefix : [envPrefix];

			// Load environment based on the custom config
			const envDir = config.envDir ?? config.root ?? process.cwd();
			// NOTE: We use 'options as any' here strictly to bypass TypeScript's "Type instantiation is excessively deep" errors.
			// This assertion ONLY affects compile-time checking; runtime validation (including Standard Schema via def["~standard"])
			// remains fully intact and functional.
			const env = arkenv(options as any, {
				env: loadEnv(mode, envDir, ""),
			});

			// Filter to only include environment variables matching the prefix
			// This prevents server-only variables from being exposed to client code
			const filteredEnv = Object.fromEntries(
				Object.entries(<SchemaShape>env).filter(([key]) =>
					prefixes.some((prefix) => key.startsWith(prefix)),
				),
			);

			// Expose transformed environment variables through Vite's define option
			// Only prefixed variables are exposed to client code
			const define = Object.fromEntries(
				Object.entries(filteredEnv).map(([key, value]) => [
					`import.meta.env.${key}`,
					JSON.stringify(value),
				]),
			);

			return { define };
		},
	};
}
