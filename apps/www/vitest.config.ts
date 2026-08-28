import react from "@vitejs/plugin-react";
import { defineProject } from "vitest/config";

export default defineProject({
	plugins: [react()],
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		name: "arkenv.js.org",
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
		restoreMocks: true,
		unstubEnvs: true,
		unstubGlobals: true,
	},
});
