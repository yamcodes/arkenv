import preserveUseClient from "rollup-plugin-preserve-use-client";
import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/components/index.ts", "src/utils/index.ts", "src/mdx/index.tsx"],
	format: ["esm", "cjs"],
	minify: true,
	dts: true,
	plugins: [preserveUseClient()],
});
