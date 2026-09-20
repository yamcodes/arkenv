import { describe, expect, it } from "vitest";
import { getDefaultSkillSource, SKILL_SOURCE_REPO } from "./plan";

describe("getDefaultSkillSource", () => {
	it("always uses the short repo form", () => {
		expect(getDefaultSkillSource()).toBe(SKILL_SOURCE_REPO);
		expect(SKILL_SOURCE_REPO).toBe("yamcodes/arkenv");
	});
});
