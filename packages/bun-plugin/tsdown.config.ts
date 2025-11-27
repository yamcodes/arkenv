import { defineConfig } from "tsdown";

export default defineConfig({
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	sourcemap: true,
	dts: {
		resolve: ["@repo/types"],
	},
});
