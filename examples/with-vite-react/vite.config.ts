import arkenvVitePlugin from "@arkenv/vite-plugin";
import react from "@vitejs/plugin-react";
import arkenv, { type } from "arkenv";
import { defineConfig, loadEnv } from "vite";

export const Env = type({
	PORT: "number.port",
	VITE_TEST: "string",
});

export default defineConfig(({ mode }) => {
	const env = arkenv(Env, loadEnv(mode, process.cwd(), ""));

	return {
		plugins: [react(), arkenvVitePlugin(Env)],
		server: {
			port: env.PORT,
		},
	};
});
