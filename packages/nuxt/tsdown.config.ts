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
		"src/empty-server-boot.ts",
		"src/server-boot.ts",
		"src/boot-gate.ts",
		"src/runtime/nitro-boot-plugin.ts",
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
			"nitropack",
			"#arkenv/client-env",
			"#arkenv/shared-schema",
			"#arkenv/server-boot",
		],
	},
});
