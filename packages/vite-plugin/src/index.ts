import type { EnvSchema } from "arkenv";
import { createEnv } from "arkenv";
import type { type } from "arktype";
import { loadEnv, type Plugin } from "vite";

export type { ImportMetaEnvAugmented } from "./types";

/**
 * TODO: If possible, find a better type than "const T extends Record<string, unknown>",
 * and be as close as possible to the type accepted by ArkType's `type`.
 */

/**
 * Vite plugin to validate environment variables using ArkEnv and expose them to client code.
 *
 * The plugin validates environment variables using ArkEnv's schema validation and
 * automatically filters them based on Vite's `envPrefix` configuration (defaults to `"VITE_"`).
 * Only environment variables matching the prefix are exposed to client code via `import.meta.env.*`.
 *
 * @param options - The environment variable schema definition. Can be an `EnvSchema` object
 *   for type-safe validation or an ArkType `type.Any` for dynamic schemas.
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
 * console.log(import.meta.env.VITE_API_URL); // Type-safe access
 * ```
 */
export default function arkenv<const T extends Record<string, unknown>>(
	options: EnvSchema<T>,
): Plugin;
export default function arkenv(options: type.Any): Plugin;
export default function arkenv<const T extends Record<string, unknown>>(
	options: EnvSchema<T> | type.Any,
): Plugin {
	return {
		name: "@arkenv/vite-plugin",
		config(config, { mode }) {
			// Get the Vite prefix for client-exposed environment variables
			// Defaults to "VITE_" if not specified
			// Vite allows envPrefix to be a string or array of strings
			const envPrefix = config.envPrefix ?? "VITE_";
			const prefixes = Array.isArray(envPrefix) ? envPrefix : [envPrefix];

			// createEnv accepts both EnvSchema and type.Any at runtime
			// We use overloads above to provide external type precision
			const env = createEnv(options, loadEnv(mode, process.cwd(), ""));

			// Filter to only include environment variables matching the prefix
			// This prevents server-only variables from being exposed to client code
			const filteredEnv = Object.fromEntries(
				Object.entries(<Record<string, unknown>>env).filter(([key]) =>
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
