import arkenvVitePlugin from "@arkenv/vite-plugin";
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
	vite: {
		// Transform mode: rewrite src/env.ts in the client graph (ADR 0015).
		// SPA mode (`arkenv(schema)` + ImportMetaEnvAugmented) remains supported.
		plugins: [arkenvVitePlugin()],
	},
});
