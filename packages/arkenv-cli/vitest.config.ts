import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "arkenv-cli",
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
});
