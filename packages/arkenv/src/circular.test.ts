import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, it } from "vitest";

describe("Circular Imports", () => {
	it(
		"should not have any circular imports",
		() => {
			const packageRoot = join(__dirname, "..");
			const dpdmBin = join(packageRoot, "../../node_modules/.bin/dpdm");
			try {
				// Call dpdm directly — `pnpm dpdm` goes through the nub pnpm shim and
				// can hang past vitest's default timeout under CI.
				execFileSync(
					dpdmBin,
					["src/index.ts", "--no-warning", "--no-tree", "--exit-code", "circular:1"],
					{
						cwd: packageRoot,
						stdio: "pipe",
					},
				);
			} catch (error: any) {
				const output = error.stdout?.toString() || error.message;
				throw new Error(`Circular imports detected:\n${output}`);
			}
		},
		15_000,
	);
});
