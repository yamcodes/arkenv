import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "@repo/log",
		unstubEnvs: true,
		restoreMocks: true,
		unstubGlobals: true,
	},
});
