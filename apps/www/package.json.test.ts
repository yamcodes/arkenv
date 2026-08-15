import { describe, expect, it } from "vitest";
import packageJson from "./package.json";

describe("www package scripts", () => {
	it("keeps next dev as the only long-lived process", () => {
		expect(packageJson.scripts.dev).toBe("next dev");
		expect(packageJson.scripts.dev).not.toContain("next-video");
		expect(packageJson.scripts.dev).not.toContain("conc");
	});

	it("runs a one-shot next-video sync before next dev", () => {
		expect(packageJson.scripts.predev).toContain("next-video sync");
		expect(packageJson.scripts.predev).not.toContain("next-video sync -w");
	});
});
