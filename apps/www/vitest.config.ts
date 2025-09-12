import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		alias: {
			"~": resolve(__dirname, "."),
		},
	},
});
