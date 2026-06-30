import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/config.ts",
		"src/module.ts",
		"src/server.ts",
		"src/client.ts",
		"src/shared.ts",
		"src/mock-imports.ts",
	],
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	sourcemap: true,
	deps: {
		alwaysBundle: ["@repo/types"],
		neverBundle: ["@nuxt/kit", "@nuxt/schema", "#imports", "nuxt/app"],
	},
});
