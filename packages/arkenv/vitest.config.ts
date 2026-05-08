import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "arkenv",
		globalSetup: ["test/setup-attest.ts"],
	},
});
