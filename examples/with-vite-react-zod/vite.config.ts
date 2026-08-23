import arkenv from "@arkenv/standard";
import arkenvVitePlugin from "@arkenv/vite-plugin/standard";
import reactPlugin from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { z } from "zod";

// Define the schema once, outside of defineConfig using Zod
// This schema is used for both:
// 1. Validating unprefixed config variables (PORT) via loadEnv
// 2. Validating VITE_* variables via the plugin
export const Env = {
	PORT: z.coerce.number().default(3000),
	VITE_MY_VAR: z.string().default("Hello from ArkEnv with Zod"),
	VITE_MY_NUMBER: z.coerce.number().default(42),
	VITE_MY_BOOLEAN: z.coerce.boolean().default(true),
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = arkenv(Env, { env: loadEnv(mode, process.cwd(), "") });

	console.log(`${env.VITE_MY_NUMBER} ${typeof env.VITE_MY_NUMBER}`);
	return {
		plugins: [
			reactPlugin(),
			// The plugin validates VITE_* variables and automatically filters to only expose
			// variables matching the Vite prefix (defaults to VITE_). Server-only variables
			// like PORT are automatically excluded from the client bundle.
			// The same schema is reused here to avoid duplication
			arkenvVitePlugin(Env),
		],
		resolve: {
			tsconfigPaths: true,
		},
		server: {
			port: env.PORT,
		},
	};
});
