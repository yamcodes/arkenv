import path from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "@arkenv/vite-plugin",
	},
	resolve: {
		alias: {
			arkenv: path.resolve(__dirname, "../arkenv/src/index.ts"),
		},
	},
	plugins: [tsconfigPaths()],
});
