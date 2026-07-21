import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/config.ts",
		"src/module.ts",
		"src/server.ts",
		"src/client.ts",
		"src/empty-client-env.ts",
		"src/empty-shared-schema.ts",
		"src/standard/index.ts",
		"src/standard/module.ts",
		"src/standard/server.ts",
		"src/standard/client.ts",
		"src/standard/shared.ts",
		"src/standard/config.ts",
	],
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	sourcemap: true,
	deps: {
		alwaysBundle: ["@repo/log", "@repo/types", "@repo/utils"],
		neverBundle: [
			"@nuxt/kit",
			"@nuxt/schema",
			"#arkenv/client-env",
			"#arkenv/shared-schema",
		],
	},
});
