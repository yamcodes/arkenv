import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "@arkenv/vite-plugin",
		environment: "node",
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: ["node_modules/", "dist/", "**/*.test.ts", "**/*.config.ts"],
		},
	},
	resolve: {
		alias: {
			arkenv: path.resolve(__dirname, "../arkenv/src/index.ts"),
		},
	},
});
