import { defineConfig } from "tsdown";

export default defineConfig([
	// Main bundle with client components
	{
		entry: ["src/index.ts"],
		format: ["esm", "cjs"],
		dts: true,
		clean: true,
		treeshake: true,
		banner: {
			js: '"use client";',
		},
	},
	// MDX components - no "use client" banner (individual components handle it)
	{
		entry: ["src/mdx.tsx"],
		format: ["esm", "cjs"],
		dts: true,
		treeshake: true,
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
