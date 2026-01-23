import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/components/index.ts", "src/utils/index.ts"],
	format: ["esm", "cjs"],
	minify: true,
});
