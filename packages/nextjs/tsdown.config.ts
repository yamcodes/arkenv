import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/react-server.ts",
		"src/config/index.ts",
		"src/server.ts",
		"src/client.ts",
		"src/mock-server-only.ts",
		"src/standard/index.ts",
		"src/standard/server.ts",
		"src/standard/client.ts",
		"src/standard/shared.ts",
		"src/standard/config.ts",
	],
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
	sourcemap: true,
	deps: {
		alwaysBundle: ["@repo/log", "@repo/types", "@repo/utils"],
	},
});
