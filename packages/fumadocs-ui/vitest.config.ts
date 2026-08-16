import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "@arkenv/fumadocs-ui",
		unstubEnvs: true,
		restoreMocks: true,
		unstubGlobals: true,
	},
});
