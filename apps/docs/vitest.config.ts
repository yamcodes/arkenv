/// <reference types="vitest" />
/// <reference types="./test/setup" />

import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			exclude: [
				"node_modules/**",
				".next/**",
				"coverage/**",
				"**/*.d.ts",
				"**/*.config.*",
				"**/index.ts",
			],
		},
	},
	resolve: {
		alias: {
			"~": resolve(__dirname, "./"),
		},
	},
});
