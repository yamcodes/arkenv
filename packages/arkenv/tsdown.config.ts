import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/arktype/index.ts"],
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	dts: {
		resolve: ["@repo/types", "@repo/scope"],
	},
	external: ["arktype"],
	noExternal: ["@repo/scope"],
});
