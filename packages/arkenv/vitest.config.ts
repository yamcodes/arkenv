import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "arkenv",
		globalSetup: ["src/setup-attest.ts"],
	},
});
