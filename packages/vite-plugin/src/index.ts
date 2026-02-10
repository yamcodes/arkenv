import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import { type ArkEnvConfig, createEnv, type EnvSchema } from "arkenv";
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
 * @param options - The environment variable schema definition. Can be an `EnvSchema` object
 *   for typesafe validation or an ArkType `CompiledEnvSchema` for dynamic schemas.
 * @param arkenvConfig - Optional configuration for ArkEnv, including validator mode selection.
 *   Use `{ validator: "standard" }` to use Standard Schema validators (e.g., Zod, Valibot) instead of ArkType.
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
 *
 * @example
 * ```ts
 * // Using Standard Schema validators (e.g., Zod)
 * import { defineConfig } from 'vite';
 * import { z } from 'zod';
 * import arkenv from '@arkenv/vite-plugin';
 *
 * export default defineConfig({
 *   plugins: [
 *     arkenv({
 *       VITE_API_URL: z.url(),
 *       VITE_API_KEY: z.string().min(1),
 *     }, {
 *       validator: 'standard'
 *     }),
 *   ],
 * });
 * ```
 */
export default function arkenv(
	options: CompiledEnvSchema,
	arkenvConfig?: ArkEnvConfig,
): Plugin;
export default function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T>,
	arkenvConfig?: ArkEnvConfig,
): Plugin;
export default function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T> | CompiledEnvSchema,
	arkenvConfig?: ArkEnvConfig,
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
			// Type assertion needed on `options` to avoid TS2589 (excessively deep type instantiation)
			// from ArkType's generic inference on the union type
			const env: SchemaShape = createEnv(options as any, {
				...arkenvConfig,
				env: arkenvConfig?.env ?? loadEnv(mode, envDir, ""),
			});

			// Filter to only include environment variables matching the prefix
			// This prevents server-only variables from being exposed to client code
			const filteredEnv = Object.fromEntries(
				Object.entries(env).filter(([key]) =>
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
