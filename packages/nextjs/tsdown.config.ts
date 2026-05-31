import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/react-server.ts",
		"src/config.ts",
		"src/server.ts",
		"src/client.ts",
		"src/shared.ts",
	],
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	sourcemap: true,
	deps: {
		alwaysBundle: ["@repo/types"],
	},
});
