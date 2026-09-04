import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	minify: true,
	fixedExtension: false,
	sourcemap: false,
	deps: {
		alwaysBundle: ["@repo/log", "@repo/utils"],
	},
});
