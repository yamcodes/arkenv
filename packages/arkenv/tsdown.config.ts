import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/bin.ts"],
	format: ["esm"],
	platform: "node",
	minify: true,
	fixedExtension: false,
	shims: true,
	sourcemap: false,
	deps: {
		alwaysBundle: ["@repo/log", "@clack/prompts", "@repo/utils", "picocolors"],
	},
});
