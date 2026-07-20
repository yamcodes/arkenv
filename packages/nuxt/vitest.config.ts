import path from "node:path";
import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "@arkenv/nuxt",
		unstubEnvs: true,
		restoreMocks: true,
		unstubGlobals: true,
	},
	resolve: {
		tsconfigPaths: true,
		alias: [
			{
				find: /^arkenv\/arktype$/,
				replacement: path.resolve(__dirname, "../arkenv/src/arktype/index.ts"),
			},
			{
				find: /^arkenv$/,
				replacement: path.resolve(__dirname, "../arkenv/src/index.ts"),
			},
			{
				find: "#imports",
				replacement: path.resolve(__dirname, "./src/mock-imports.ts"),
			},
		],
	},
});
