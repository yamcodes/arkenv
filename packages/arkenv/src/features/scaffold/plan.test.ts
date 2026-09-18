import { describe, expect, it } from "vitest";
import {
	DEFAULT_SKILL_SOURCE,
	getDefaultSkillSource,
	SKILL_SOURCE_V1_TREE,
} from "./plan";

describe("getDefaultSkillSource", () => {
	it("always pins the v1 tree URL (prerelease and stable)", () => {
		expect(getDefaultSkillSource()).toBe(SKILL_SOURCE_V1_TREE);
		expect(DEFAULT_SKILL_SOURCE).toBe(SKILL_SOURCE_V1_TREE);
		expect(SKILL_SOURCE_V1_TREE).toBe(
			"https://github.com/yamcodes/arkenv/tree/v1",
		);
	});
});
