import path from "node:path";
import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "@arkenv/vite-plugin",
	},
	resolve: {
		alias: [
			{
				find: /^arkenv\/arktype$/,
				replacement: path.resolve(__dirname, "../arkenv/src/arktype/index.ts"),
			},
			{
				find: /^arkenv$/,
				replacement: path.resolve(__dirname, "../arkenv/src/index.ts"),
			},
		],
	},
});
