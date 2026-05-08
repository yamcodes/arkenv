import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/index.ts",
	format: ["esm", "cjs"],
	minify: true,
	platform: "node",
	fixedExtension: false,
	deps: {
		alwaysBundle: ["@repo/types"],
	},
});
