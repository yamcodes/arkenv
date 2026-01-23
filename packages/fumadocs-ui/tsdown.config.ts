import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/mdx.tsx", "src/utils/index"],
	format: ["esm", "cjs"],
	minify: true,
});
