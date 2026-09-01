import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/bin.ts"],
	format: ["esm", "cjs"],
	platform: "node",
	minify: false,
	fixedExtension: false,
	shims: true,
	sourcemap: false,
});
