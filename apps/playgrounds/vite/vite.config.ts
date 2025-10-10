import arkenv from "@arkenv/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		arkenv({
			PORT: "number.port",
		}),
	],
});
