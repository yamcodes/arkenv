import arkenv from "@arkenv/bun-plugin";

await Bun.build({
	entrypoints: ["./src/index.html"],
	outdir: "./dist",
	sourcemap: true,
	target: "browser",
	minify: true,
	define: {
		"process.env.NODE_ENV": "production",
	},
	plugins: [
		arkenv({
			BUN_PUBLIC_API_URL: "string",
			BUN_PUBLIC_DEBUG: "boolean",
		}),
	],
});
