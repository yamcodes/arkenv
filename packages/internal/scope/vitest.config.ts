import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "@repo/scope",
		unstubEnvs: true,
		restoreMocks: true,
		unstubGlobals: true,
	},
});
