import arkenvVitePlugin from "@arkenv/vite-plugin";
import reactPlugin from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";

// Cast: under the Vite version matrix, pnpm can resolve two copies of the same
// vite major (with/without optional jiti), so PluginOption from plugin-react and
// defineConfig disagree even though they are the same Vite API.
export default defineConfig({
	plugins: [
		reactPlugin() as PluginOption,
		arkenvVitePlugin() as PluginOption,
	],
});
