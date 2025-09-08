import type { EnvSchema } from "arkenv";
import { createEnv } from "arkenv";
import { loadEnv, type Plugin } from "vite";

export default <T extends Record<string, string | undefined>>(
	options: EnvSchema<T>,
): Plugin => ({
	name: "@arkenv/vite-plugin",
	config(_config, { mode }) {
		createEnv(options, loadEnv(mode, process.cwd(), ""));
	},
});
