import arkenvVitePlugin from "@arkenv/vite-plugin";
import { defineConfig } from "@solidjs/start/config";
import arkenv, { type } from "arkenv";
import { loadEnv } from "vite";

// Define the schema once, outside of defineConfig using type()
// This schema is used for both:
// 1. Validating unprefixed config variables (PORT) via loadEnv
// 2. Validating VITE_* variables via the plugin
export const Env = type({
	PORT: "number.port",
	VITE_TEST: "string",
});

export default defineConfig(({ mode }) => {
	// Load and validate server-side environment variables
	const env = arkenv(Env, loadEnv(mode, process.cwd(), ""));

	return {
		plugins: [
			// The plugin validates VITE_* variables and automatically filters to only expose
			// variables matching the Vite prefix (defaults to VITE_). Server-only variables
			// like PORT are automatically excluded from the client bundle.
			arkenvVitePlugin(Env),
		],
		server: {
			port: env.PORT,
		},
	};
});
