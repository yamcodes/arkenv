import arkenv from "@arkenv/core";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { Env } from "./env";

export default defineConfig(({ mode }) => {
	const env = arkenv(Env, { env: loadEnv(mode, process.cwd(), "") });
	const dashfyServer = `http://${env.HOST}:${env.PORT}`;

	return {
		plugins: [react()],
		define: {
			"import.meta.env.VITE_DASHFY_SERVER": JSON.stringify(dashfyServer),
		},
		build: {
			outDir: "build",
			emptyOutDir: true,
		},
		server: {
			port: 3001,
			proxy: {
				"/config": dashfyServer,
				"/socket.io": { target: dashfyServer, ws: true },
			},
		},
	};
});
