import type { EnvSchema } from "arkenv";
import { createEnv } from "arkenv";
import type { type } from "arktype";
import { loadEnv, type Plugin, type ResolvedConfig } from "vite";
import { createViteLoggerAdapter } from "./logger-adapter";

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
 *   for typesafe validation or an ArkType `type.Any` for dynamic schemas.
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
export default function arkenv<const T extends Record<string, unknown>>(
	options: EnvSchema<T>,
): Plugin;
export default function arkenv(options: type.Any): Plugin;

export default function arkenv<const T extends Record<string, unknown>>(
	options: EnvSchema<T> | type.Any,
): Plugin {
	let resolvedConfig: ResolvedConfig | undefined;
	let mode = "development";
	let envPrefix: string | string[] = "VITE_";

	return {
		name: "@arkenv/vite-plugin",
		config(config, { mode: configMode }) {
			// Store mode and envPrefix for later use
			mode = configMode;
			envPrefix = config.envPrefix ?? "VITE_";
			const prefixes = Array.isArray(envPrefix) ? envPrefix : [envPrefix];

			// Validate environment variables (without logger for now, as config runs before configResolved)
			// We'll re-validate with logger in buildStart to get properly formatted errors
			try {
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
			} catch {
				// Error will be caught and displayed in buildStart with logger
				// Return empty define to prevent further errors
				return { define: {} };
			}
		},
		configResolved(config) {
			// Store resolved config to access logger
			resolvedConfig = config;
		},
		buildStart() {
			if (!resolvedConfig) return;

			// Re-validate with logger to get properly formatted errors
			const logger = createViteLoggerAdapter(resolvedConfig.logger);

			try {
				// Validate with logger (errors will be formatted using Vite's logger)
				// Use type assertion to access the implementation signature
				// The overloads should support logger, but TypeScript needs help here
				(
					createEnv as (
						def: EnvSchema<Record<string, unknown>> | type.Any,
						env?: Record<string, string | undefined>,
						logger?: ReturnType<typeof createViteLoggerAdapter>,
					) => unknown
				)(options, loadEnv(mode, process.cwd(), ""), logger);
			} catch (error) {
				// Format and display errors using Vite's logger
				const log = resolvedConfig.logger;
				log.error("\nMissing or invalid environment variables:\n");

				// Extract error message (already formatted by ArkEnvError with logger)
				if (error instanceof Error) {
					const errorMessage = error.message;
					// Split by newlines to format each line
					const lines = errorMessage.split("\n");
					for (const line of lines) {
						if (line.trim()) {
							log.error(`  ${line}`);
						}
					}
				}

				log.error("\nFix your .env or system env and try again.\n");

				// Fail the build with a Rollup-style error
				this.error("Environment validation failed");
			}
		},
	};
}
