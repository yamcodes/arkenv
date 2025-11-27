import arkenv from "@arkenv/bun-plugin";

await Bun.build({
	entrypoints: ["./src/index.html"],
	outdir: "./dist",
	sourcemap: true,
	target: "browser",
	minify: true,
	plugins: [arkenv],
	// define NODE_ENV=production
	define: {
		"process.env.NODE_ENV": '"production"',
	},
});
