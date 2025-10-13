import type { EnvSchema } from "arkenv";
import { createEnv } from "arkenv";
import { loadEnv, type Plugin } from "vite";

/**
 * TODO: If possible, find a better type than "const T extends Record<string, unknown>",
 * and be as close as possible to the type accepted by ArkType's `type`.
 */

export default function arkenv<const T extends Record<string, unknown>>(
	options: EnvSchema<T>,
): Plugin {
	return {
		name: "@arkenv/vite-plugin",
		config(_config, { mode }) {
			createEnv(options, loadEnv(mode, process.cwd(), ""));
		},
	};
}
