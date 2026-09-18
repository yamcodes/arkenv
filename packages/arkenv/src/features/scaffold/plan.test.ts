import { describe, expect, it } from "vitest";
import { DEFAULT_SKILL_SOURCE } from "./plan";

describe("DEFAULT_SKILL_SOURCE", () => {
	it("always pins the v1 tree URL", () => {
		expect(DEFAULT_SKILL_SOURCE).toBe(
			"https://github.com/yamcodes/arkenv/tree/v1",
		);
	});
});
