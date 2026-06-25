import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "cli",
		environment: "node",
		include: ["src/**/*.test.ts"],
		unstubEnvs: true,
		restoreMocks: true,
		unstubGlobals: true,
	},
	resolve: {
		tsconfigPaths: true,
	},
});
