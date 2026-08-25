import arkenvVitePlugin from "@arkenv/vite-plugin/standard";
import reactPlugin from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [reactPlugin(), arkenvVitePlugin()],
	resolve: {
		tsconfigPaths: true,
	},
});
