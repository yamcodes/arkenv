import type { BuildConfig } from "bun";
import dts from "bun-plugin-dts";

const defaultBuildConfig: BuildConfig = {
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
};

// Rimraf

try {
	Bun.spawn(["rm", "-rf", "./dist"]);
} catch (error) {
	console.error("Failed to clean dist directory:", error);
	process.exit(1);
}

// Build

await Promise.all([
	Bun.build({
		...defaultBuildConfig,
		plugins: [dts()],
		format: "esm",
		naming: "[dir]/[name].js",
	}),
	Bun.build({
		...defaultBuildConfig,
		format: "cjs",
		naming: "[dir]/[name].cjs",
	}),
]);
