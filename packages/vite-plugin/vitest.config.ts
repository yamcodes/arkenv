import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "@arkenv/vite-plugin",
		environment: "node",
	},
	resolve: {
		alias: {
			arkenv: path.resolve(__dirname, "../arkenv/src/index.ts"),
		},
	},
});
