import arkenvVitePlugin from "@arkenv/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		port: 3000,
	},
	plugins: [tanstackStart({ srcDirectory: "src" }), arkenvVitePlugin()],
});
