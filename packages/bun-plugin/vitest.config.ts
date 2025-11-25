import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
	},
	resolve: {
		alias: {
			// Mock bun module for testing
			bun: new URL("./src/__mocks__/bun.ts", import.meta.url).pathname,
		},
	},
});
