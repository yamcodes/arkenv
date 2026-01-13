import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "arkenv",
	},
	plugins: [tsconfigPaths()],
});
