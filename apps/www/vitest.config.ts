import path from "node:path";
import { fileURLToPath } from "node:url";
import { setupArkEnv } from "@arkenv/nextjs/config";
import babel from "@rolldown/plugin-babel";
import react from "@vitejs/plugin-react";
import { defineProject } from "vitest/config";

const dir = path.dirname(fileURLToPath(import.meta.url));
try {
	setupArkEnv({ schemaPath: path.join(dir, "env.ts") });
} catch {
	// Ignore if @arkenv/nextjs is not built yet
}

export default defineProject({
	plugins: [
		react(),
		babel({
			plugins: ["styled-jsx/babel"],
		}),
	],
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
