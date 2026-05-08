import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		standard: "src/standard.ts",
		core: "src/core.ts",
		cli: "src/cli/index.ts",
	},
	format: {
		esm: {},
		cjs: {
			define: {
				"import.meta": "{}",
			},
		},
	},
	platform: "node",
	minify: true,
	fixedExtension: true,
	deps: {
		alwaysBundle: ["@repo/scope", "@repo/types"],
		neverBundle: ["arktype"],
	},
	outputOptions: {
		exports: "named",
	},
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
