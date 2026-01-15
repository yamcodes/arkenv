import { defineConfig } from "tsdown";

export default defineConfig({
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	dts: {
		resolve: ["@repo/types", "@repo/scope"],
	},
	external: ["arktype"],
	// Force bundling of workspace packages
	noExternal: ["@repo/scope"],
});
