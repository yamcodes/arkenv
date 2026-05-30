import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/react-server.ts", "src/config.ts"],
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	sourcemap: true,
	deps: {
		alwaysBundle: ["@repo/types"],
	},
});
