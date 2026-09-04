import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "@arkenv/rsbuild-plugin",
		unstubEnvs: true,
		restoreMocks: true,
		unstubGlobals: true,
	},
	resolve: {
		tsconfigPaths: true,
	},
});
