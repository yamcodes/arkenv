import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: [
			"packages/*",
			"apps/*",
			"!apps/playwright-www",
			"!**/*.md",
			{
				test: {
					name: "scripts",
					include: ["scripts/**/*.test.js"],
				},
			},
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				...coverageConfigDefaults.exclude,
				"**/dist/",
				"**/coverage/**",
				"**/*.d.ts",
				"**/.next/",
				"**/dist-test/",
				"**/build/**",
				"**/examples/**",
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
		restoreMocks: true,
		unstubGlobals: true,
	},
});
