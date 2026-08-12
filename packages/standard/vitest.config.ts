import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "@arkenv/standard",
		include: ["**/*.{test,spec,test-d}.?(c|m)[jt]s?(x)"],
		unstubEnvs: true,
		restoreMocks: true,
		unstubGlobals: true,
	},
	resolve: {
		tsconfigPaths: true,
	},
});
