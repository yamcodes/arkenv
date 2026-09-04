import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/safe.ts", "src/valibot.ts", "src/zod-mini.ts"],
	format: ["esm"],
	minify: true,
	fixedExtension: false,
	sourcemap: false,
	deps: {
		alwaysBundle: ["@repo/types", "@repo/utils"],
		neverBundle: ["@valibot/to-json-schema", "zod", "zod/mini", "arktype"],
	},
});
