import path from "node:path";
import { fileURLToPath } from "node:url";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Isolated Nub `.store` does not hoist workspace packages the way pnpm's
// `.pnpm` tree did. jiti fixtures under `/tmp` need NODE_PATH entries so
// `@arkenv/*` / `@repo/*` resolve when loading schemas outside the repo.
const nodePathEntries = [
	path.join(rootDir, "node_modules"),
	path.join(rootDir, "node_modules", ".store", "node_modules"),
	process.env.NODE_PATH,
].filter(Boolean);
process.env.NODE_PATH = [...new Set(nodePathEntries)].join(path.delimiter);

export default defineConfig({
	test: {
		setupFiles: ["packages/internal/log/vitest.setup.ts"],
		projects: [
			"packages/*",
			"packages/internal/*",
			"apps/*",
			"!packages/cli",
			"!apps/playwright-www",
			"!apps/dash",
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
