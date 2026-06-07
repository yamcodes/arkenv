import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "create-arkenv",
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
	resolve: {
		tsconfigPaths: true,
	},
});
