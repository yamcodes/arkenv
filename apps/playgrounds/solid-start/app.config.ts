import arkenvVitePlugin from "@arkenv/vite-plugin";
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
	vite: {
		plugins: [arkenvVitePlugin()],
	},
});
