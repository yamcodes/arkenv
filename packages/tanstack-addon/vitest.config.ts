import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "@arkenv/tanstack-addon",
		unstubEnvs: true,
		restoreMocks: true,
		unstubGlobals: true,
		include: ["tests/**/*.test.ts"],
	},
});
