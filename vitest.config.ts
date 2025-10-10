import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: ["packages/*", "apps/*"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"**/node_modules/",
				"**/.next/",
				"**/dist/",
				"**/dist-test/",
				"**/*.test.*",
				"**/*.config.*",
				"**/coverage/**",
				"**/build/**",
				"**/examples/**",
				"**/*.d.ts",
				"**/types/**",
				"**/static/**",
				"**/chunks/**",
				"**/webpack/**",
				"**/bootstrap/**",
				"**/runtime/**",
				"**/source/**",
				"**/content/**",
				"**/public/**",
			],
		},
		unstubEnvs: true,
	},
});
