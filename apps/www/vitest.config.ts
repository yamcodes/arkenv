import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		alias: {
			"~": resolve(__dirname, "."),
		},
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/e2e/**", // Exclude Playwright E2E tests
		],
	},
});
