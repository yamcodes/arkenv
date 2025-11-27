import arkenv from "@arkenv/bun-plugin";

await Bun.build({
	entrypoints: ["./src/index.html"],
	outdir: "./dist",
	sourcemap: true,
	target: "browser",
	minify: true,
	plugins: [arkenv],
});
