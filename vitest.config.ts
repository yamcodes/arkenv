import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: ["packages/arkenv", "packages/vite-plugin"],
	},
});
