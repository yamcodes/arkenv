import { arkenvRsbuildPlugin } from "@arkenv/rsbuild-plugin";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/rsbuild";

export default defineConfig({
	server: {
		port: 3000,
	},
	plugins: [
		tanstackStart({ srcDirectory: "src" }),
		pluginReact(),
		arkenvRsbuildPlugin(),
	],
});
