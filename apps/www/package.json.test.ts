import { describe, expect, it } from "vitest";
import packageJson from "./package.json";

describe("www package scripts", () => {
	it("keeps next dev as the only long-lived process", () => {
		expect(packageJson.scripts.dev).toBe("next dev");
		expect(packageJson.scripts.dev).not.toContain("conc");
	});

	it("does not run a video pipeline before next dev", () => {
		expect(packageJson.scripts).not.toHaveProperty("video:sync");
		expect(packageJson.scripts.predev).not.toContain("video");
	});
});
