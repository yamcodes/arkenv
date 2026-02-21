import arkenvVitePlugin from "@arkenv/vite-plugin";
import { defineConfig } from "@solidjs/start/config";
import { type } from "arkenv";

export const Env = type({
	VITE_TEST: "string",
	VITE_NUMERIC: "string.numeric",
	VITE_BOOLEAN: "boolean",
});

export default defineConfig({
	vite: {
		plugins: [arkenvVitePlugin(Env)],
	},
});
