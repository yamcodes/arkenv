import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/valibot.ts", "src/zod-mini.ts"],
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	deps: {
		alwaysBundle: ["@repo/types", "@repo/utils"],
		neverBundle: ["@valibot/to-json-schema", "zod"],
	},
});
