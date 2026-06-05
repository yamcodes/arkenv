import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "arkenv",
		include: ["**/*.{test,spec,test-d}.?(c|m)[jt]s?(x)"],
		// globalSetup: ["test/setup-attest.ts"],
	},
	resolve: {
		tsconfigPaths: true,
	},
});
