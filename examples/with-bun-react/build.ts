import arkenv from "@arkenv/bun-plugin";

const result = await Bun.build({
	entrypoints: ["./src/index.html"],
	outdir: "./dist",
	sourcemap: "external",
	target: "browser",
	minify: true,
	define: {
		"process.env.NODE_ENV": JSON.stringify("production"),
	},
	plugins: [arkenv],
});

if (!result.success) {
	console.error("Build failed");
	for (const message of result.logs) {
		console.error(message);
	}
	process.exit(1);
}

console.log("Build successful!");
