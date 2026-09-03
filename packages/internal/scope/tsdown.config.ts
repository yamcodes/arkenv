import { defineConfig } from "tsdown";

export default defineConfig({
	format: ["esm"],
	minify: true,
	fixedExtension: false,
	sourcemap: false,
	deps: {
		alwaysBundle: ["@repo/types"],
		neverBundle: ["arktype", "@ark/util", "@ark/schema", "arkregex"],
	},
});
