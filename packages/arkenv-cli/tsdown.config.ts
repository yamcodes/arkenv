import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/index.ts",
	format: "cjs",
	platform: "node",
	minify: true,
	unbundle: false,
	fixedExtension: true,
	shims: true,
});
