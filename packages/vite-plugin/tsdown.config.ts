import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/standard.ts"],
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	deps: {
		alwaysBundle: ["@repo/log", "@repo/types", "@repo/utils"],
		// jiti loads the user's env.ts at build time; keep it external so the
		// plugin does not ship a second copy and Node can resolve project deps.
		// @arkenv/build is a workspace runtime dependency for key extraction.
		neverBundle: ["vite", "@arkenv/build", "jiti"],
	},
});
