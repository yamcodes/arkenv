import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "cli",
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
