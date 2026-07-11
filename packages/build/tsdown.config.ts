import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/log.ts"],
	format: ["esm", "cjs"],
	minify: true,
	fixedExtension: false,
});
