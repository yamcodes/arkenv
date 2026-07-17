import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/standard.ts"],
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	deps: {
		alwaysBundle: ["@repo/log", "@repo/types", "@repo/utils"],
	},
});
