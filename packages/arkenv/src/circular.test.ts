import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, it } from "vitest";

describe("Circular Imports", () => {
	it("should not have any circular imports", () => {
		const packageRoot = join(__dirname, "..");
		// Resolve the JS entry — not node_modules/.bin/dpdm — so Windows does
		// not need the pnpm `.cmd` shim that execFileSync cannot launch.
		// dpdm is a root-workspace dep; avoid createRequire from this package
		// (WARN_PHANTOM_DEP) by walking to the repo root node_modules.
		const dpdmJs = join(packageRoot, "../../node_modules/dpdm/lib/bin/dpdm.js");
		try {
			// Call dpdm via node — `pnpm dpdm` goes through the nub pnpm shim and
			// can hang past vitest's default timeout under CI.
			execFileSync(
				process.execPath,
				[
					dpdmJs,
					"src/index.ts",
					"--no-warning",
					"--no-tree",
					"--exit-code",
					"circular:1",
				],
				{
					cwd: packageRoot,
					stdio: "pipe",
				},
			);
		} catch (error: any) {
			const output = error.stdout?.toString() || error.message;
			throw new Error(`Circular imports detected:\n${output}`);
		}
	}, 15_000);
});
