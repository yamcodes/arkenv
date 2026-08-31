import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/index.ts",
	format: "cjs",
	platform: "node",
	minify: true,
	fixedExtension: true,
	shims: true,
	sourcemap: false,
	deps: {
		alwaysBundle: ["@clack/prompts", "picocolors"],
	},
});
