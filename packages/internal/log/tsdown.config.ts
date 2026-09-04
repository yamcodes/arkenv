import { defineConfig } from "tsdown";

export default defineConfig({
	format: ["esm"],
	minify: true,
	fixedExtension: false,
	sourcemap: false,
});
