import { defineProject } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineProject({
	test: {
		name: "arkenv",
	},
	plugins: [tsconfigPaths()],
});
