import { defineConfig } from "tsdown";

export default defineConfig([
	// Main bundle with client components
	{
		entry: ["src/index.ts", "src/mdx.tsx"],
		format: ["esm", "cjs"],
		dts: true,
		clean: true,
		treeshake: true,
		banner: {
			js: '"use client";',
		},
	},
	// Separate server-safe utilities bundle
	{
		entry: ["src/utils/index.ts"],
		format: ["esm", "cjs"],
		dts: true,
		outDir: "dist/utils",
		treeshake: true,
	},
]);
