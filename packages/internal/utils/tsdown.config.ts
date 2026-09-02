import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		log: "src/utils/log-helpers.ts",
		"boundary-access-error": "src/utils/boundary-access-error.ts",
	},
	format: ["esm", "cjs"],
	// Unminified: published packages alwaysBundle this package. Pre-minified
	// chunks (index + boundary-access-error) collide when concatenated into one
	// module scope (Nuxt/Vite: "Identifier h has already been declared").
	minify: false,
	fixedExtension: false,
	sourcemap: false,
	deps: {
		alwaysBundle: ["@repo/log", "@repo/types"],
		neverBundle: ["arktype", "@ark/util", "@ark/schema", "arkregex"],
	},
});
