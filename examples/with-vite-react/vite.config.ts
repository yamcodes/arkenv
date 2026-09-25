import arkenvPlugin from "@arkenv/vite-plugin";
import reactPlugin from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [reactPlugin(), arkenvPlugin()],
	resolve: {
		tsconfigPaths: true,
	},
});
