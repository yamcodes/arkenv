import arkenvVitePlugin from "@arkenv/vite-plugin";
import reactPlugin from "@vitejs/plugin-react";
import arkenv, { type } from "arkenv";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Define the schema once, outside of defineConfig using type()
// This schema is used for both:
// 1. Validating unprefixed config variables (PORT) via loadEnv
// 2. Validating VITE_* variables via the plugin
const Env = type({
	PORT: "number.port",
	VITE_MY_VAR: "string",
	VITE_MY_NUMBER: type("string").pipe((str) => Number.parseInt(str, 10)),
	VITE_MY_BOOLEAN: type("string").pipe((str) => str === "true"),
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = arkenv(Env, loadEnv(mode, process.cwd(), ""));

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
