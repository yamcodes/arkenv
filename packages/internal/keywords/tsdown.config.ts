import { defineConfig } from "tsdown";

export default defineConfig({
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	dts: {
		resolve: ["@repo/types"],
	},
	external: ["arktype"],
	// Don't externalize @repo/scope - bundle it
});
