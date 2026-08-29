import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/config.ts",
		"src/module.ts",
		"src/empty-server-boot.ts",
		"src/server-boot.ts",
		"src/boot-gate.ts",
		"src/runtime/nitro-boot-plugin.ts",
		"src/standard/index.ts",
		"src/standard/module.ts",
		"src/standard/config.ts",
	],
	format: ["esm", "cjs"],
	// Unminified: alwaysBundle of @repo/utils (index + boundary-access-error) then
	// minify produced a chunk Vite/Rollup rejects ("Identifier h has already been
	// declared") when Nuxt playgrounds rebundle the published ESM.
	minify: false,
	fixedExtension: false,
	sourcemap: true,
	deps: {
		alwaysBundle: ["@repo/log", "@repo/types", "@repo/utils"],
		neverBundle: [
			"@nuxt/kit",
			"@nuxt/schema",
			"nitropack",
			"#arkenv/server-boot",
		],
	},
});
