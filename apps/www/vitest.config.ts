import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

export default defineProject({
	plugins: [
		react({
			plugins: [["@swc/plugin-styled-jsx", {}]],
		}),
		tsconfigPaths(),
	],
	test: {
		name: "arkenv.js.org",
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
		restoreMocks: true,
	},
});
