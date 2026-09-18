import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const isDevelopment = process.env.NODE_ENV === "development";

export default defineConfig({
	plugins: [viteSingleFile()],
	build: {
		sourcemap: isDevelopment ? "inline" : undefined,
		cssMinify: !isDevelopment,
		minify: !isDevelopment,
		rollupOptions: {
			input: "live-preview.html",
		},
		outDir: "dist",
		emptyOutDir: false,
	},
});
