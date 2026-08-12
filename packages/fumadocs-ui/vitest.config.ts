import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "fumadocs-ui",
		include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
		unstubEnvs: true,
		restoreMocks: true,
		unstubGlobals: true,
	},
	resolve: {
		tsconfigPaths: true,
	},
});
