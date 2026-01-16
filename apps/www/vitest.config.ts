import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

export default defineProject({
	plugins: [
		react({
			babel: {
				plugins: ["styled-jsx/babel"],
			},
		}),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
	],
	test: {
		name: "arkenv.js.org",
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
		restoreMocks: true,
		unstubEnvs: true,
	},
});
