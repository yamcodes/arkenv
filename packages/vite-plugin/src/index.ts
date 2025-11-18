import type { EnvSchema } from "arkenv";
import { createEnv } from "arkenv";
import type { type } from "arktype";
import { loadEnv, type Plugin } from "vite";

/**
 * TODO: If possible, find a better type than "const T extends Record<string, unknown>",
 * and be as close as possible to the type accepted by ArkType's `type`.
 */

export default function arkenv<const T extends Record<string, unknown>>(
	options: EnvSchema<T> | type.Any,
): Plugin {
	return {
		name: "@arkenv/vite-plugin",
		config(_config, { mode }) {
			const env = createEnv(options, loadEnv(mode, process.cwd(), ""));

			// Expose transformed environment variables through Vite's define option
			const define = Object.fromEntries(
				Object.entries(<Record<string, unknown>>env).map(([key, value]) => [
					`import.meta.env.${key}`,
					JSON.stringify(value),
				]),
			);

			return { define };
		},
	};
}
