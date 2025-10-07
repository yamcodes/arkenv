import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: ["packages/*", "apps/*"],
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
});
