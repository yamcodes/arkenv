import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		name: "www",
		environment: "jsdom",
		setupFiles: ["./test/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				".next/",
				"**/*.test.*",
				"**/*.config.*",
				"**/coverage/**",
				"**/dist/**",
			],
		},
	},
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "."),
		},
	},
});
