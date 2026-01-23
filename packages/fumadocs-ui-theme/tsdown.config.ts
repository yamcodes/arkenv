import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/mdx.tsx"],
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	banner: {
		js: `"use client";`,
	},
});
