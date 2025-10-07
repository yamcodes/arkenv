import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineProject } from "vitest/config";

export default defineProject({
	plugins: [react()],
	test: {
		name: "arkenv.js.org",
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
	},
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "."),
		},
	},
});
