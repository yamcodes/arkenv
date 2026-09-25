import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setup } from "@ark/attest";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export default () =>
	setup({
		// Vitest's cwd is the repo root, which has no tsconfig. Attest would
		// then fall back to moduleResolution "node10", rejected by TypeScript 6.
		tsconfig: join(packageRoot, "tsconfig.json"),
		formatter: "nubx prettier --write",
	});
