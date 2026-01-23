import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/arktype/index.ts"],
	format: ["esm", "cjs"],
	minify: true,
});
