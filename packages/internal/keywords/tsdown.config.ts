import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/functions.ts"],
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	dts: {
		resolve: ["@repo/types"],
	},
});
