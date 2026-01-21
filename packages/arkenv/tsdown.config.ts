import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/arktype/index.ts"],
	format: ["esm", "cjs"],
	platform: "node",
	minify: true,
	fixedExtension: true,
	dts: {
		resolve: ["@repo/types", "@repo/scope"],
	},
	external: ["arktype"],
	noExternal: ["@repo/scope"],
	footer: ({ format }) => {
		// TODO: Avoid this, this is a hack
		if (format === "cjs") {
			return `
// CJS Interop Shim
if (module.exports && module.exports.default) {
    Object.assign(module.exports.default, module.exports);
    module.exports = module.exports.default;
}
      `;
		}
	},
});
