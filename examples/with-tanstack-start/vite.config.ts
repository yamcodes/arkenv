import arkenvVitePlugin from "@arkenv/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		port: 3000,
	},
	plugins: [
		tanstackStart({ srcDirectory: "src" }),
		// React's Vite plugin must come after Start's plugin
		viteReact(),
		arkenvVitePlugin(),
	],
});
