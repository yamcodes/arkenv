import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/standard.ts"],
	format: ["esm"],
	minify: true,
	fixedExtension: false,
	sourcemap: false,
	deps: {
		alwaysBundle: ["@repo/log", "@repo/types", "@repo/utils"],
		// jiti loads the user's env.ts at build time; keep it external so the
		// plugin does not ship a second copy and Node can resolve project deps.
		// @arkenv/build is a workspace runtime dependency for key extraction.
		// @rsbuild/core is the host API provided by the consuming app.
		neverBundle: ["@rsbuild/core", "@arkenv/build", "jiti", "arktype"],
	},
});
