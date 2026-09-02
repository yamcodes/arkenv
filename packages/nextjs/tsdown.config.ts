import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/react-server.ts",
		"src/config/index.ts",
		"src/mock-server-only.ts",
		"src/standard/index.ts",
		"src/standard/config.ts",
	],
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	sourcemap: false,
	deps: {
		alwaysBundle: ["@repo/log", "@repo/types", "@repo/utils"],
		neverBundle: ["arktype"],
	},
});
