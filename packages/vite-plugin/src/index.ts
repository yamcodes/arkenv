import type { EnvSchema } from "arkenv";
import { createEnv } from "arkenv";
import type { type } from "arktype";
import { loadEnv, type Plugin } from "vite";

/**
 * TODO: If possible, find a better type than "const T extends Record<string, unknown>",
 * and be as close as possible to the type accepted by ArkType's `type`.
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
