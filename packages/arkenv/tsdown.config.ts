import { defineConfig } from "tsdown";

export default defineConfig({
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	dts: {
		resolve: ["@repo/types", "@repo/scope", "@repo/keywords"],
	},
	external: ["arktype"],
	// Force bundling of workspace packages
	noExternal: ["@repo/scope", "@repo/keywords"],
});
