import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		log: "src/utils/log-helpers.ts",
		"boundary-access-error": "src/utils/boundary-access-error.ts",
	},
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	deps: {
		alwaysBundle: ["@repo/log", "@repo/types"],
	},
});
