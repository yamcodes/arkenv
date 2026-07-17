import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		unstubEnvs: true,
		restoreMocks: true,
		unstubGlobals: true,
	},
	resolve: {
		tsconfigPaths: true,
		alias: {
			// Mock bun module for testing
			bun: new URL("./src/__mocks__/bun.ts", import.meta.url).pathname,
			arkenv: new URL("../arkenv/src/index.ts", import.meta.url).pathname,
		},
	},
});
