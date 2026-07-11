import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		log: "src/log.ts",
	},
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	deps: {
		alwaysBundle: ["@repo/utils"],
	},
});
