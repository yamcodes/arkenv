import { execSync } from "node:child_process";
import { describe, it, expect } from "vitest";

describe("Circular Imports", () => {
	it("should not have any circular imports", () => {
		try {
			execSync("pnpm dpdm src/index.ts --no-warning --no-tree --exit-code circular:1", {
				cwd: __dirname + "/..",
				stdio: "pipe",
			});
		} catch (error: any) {
			const output = error.stdout?.toString() || error.message;
			throw new Error(`Circular imports detected:\n${output}`);
		}
	});
});
