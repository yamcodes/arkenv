import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	dts: true,
	outDir: "dist/lib",
	entry: ["src/index.ts"],
	format: ["esm", "cjs"],
	tsconfig: "tsconfig.lib.json",
});
