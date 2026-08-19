import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	build: {
		outDir: "build",
		emptyOutDir: true,
	},
	server: {
		port: 3001,
		proxy: {
			"/config": "http://127.0.0.1:5001",
		},
	},
});
