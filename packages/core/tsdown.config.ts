import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/issues.ts", "src/safe.ts"],
	format: ["esm"],
	platform: "node",
	minify: false,
	fixedExtension: false,
	sourcemap: false,
	deps: {
		alwaysBundle: ["@repo/scope", "@repo/types", "@repo/utils"],
		neverBundle: ["arktype", "@ark/util", "@ark/schema", "arkregex"],
	},
	outputOptions: {
		exports: "named",
	},
});
