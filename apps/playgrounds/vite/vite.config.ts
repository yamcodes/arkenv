import arkenvVitePlugin from "@arkenv/vite-plugin";
import reactPlugin from "@vitejs/plugin-react";
import { defineEnv, type } from "arkenv";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Define the schema once, outside of defineConfig using type()
// This schema is used for both:
// 1. Validating unprefixed config variables (PORT) via loadEnv
// 2. Validating VITE_* variables via the plugin
export const Env = type({
	PORT: "number.port",
	VITE_MY_VAR: "unknown",
	VITE_MY_NUMBER: "number",
	VITE_MY_BOOLEAN: "boolean",
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = defineEnv(Env, { env: loadEnv(mode, process.cwd(), "") });

	console.log(`${env.VITE_MY_NUMBER} ${typeof env.VITE_MY_NUMBER}`);
	return {
		plugins: [
			tsconfigPaths(),
			reactPlugin(),
			// The plugin validates VITE_* variables and automatically filters to only expose
			// variables matching the Vite prefix (defaults to VITE_). Server-only variables
			// like PORT are automatically excluded from the client bundle.
			// The same schema is reused here to avoid duplication
			arkenvVitePlugin(Env),
		],
		server: {
			port: env.PORT,
		},
	};
});
