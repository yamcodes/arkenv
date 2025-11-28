import arkenv from "@arkenv/bun-plugin";

const result = await Bun.build({
	entrypoints: ["./src/index.html"],
	outdir: "./dist",
	sourcemap: true,
	target: "browser",
	minify: true,
	plugins: [arkenv],
	define: {
		"process.env.NODE_ENV": '"production"',
	},
});

if (!result.success) {
	console.error("Build failed:");
	for (const log of result.logs) {
		console.error(log);
	}
	process.exit(1);
}

console.log(`✓ Build succeeded: ${result.outputs.length} files generated`);
