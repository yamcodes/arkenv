import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	deps: {
		alwaysBundle: ["@repo/utils"],
	},
});
