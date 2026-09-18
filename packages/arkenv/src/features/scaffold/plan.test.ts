import { describe, expect, it } from "vitest";
import {
	getDefaultSkillSource,
	SKILL_SOURCE_REPO,
	SKILL_SOURCE_V1_TREE,
} from "./plan";

describe("getDefaultSkillSource", () => {
	it("pins the v1 tree URL for prerelease versions", () => {
		expect(getDefaultSkillSource("1.0.0-alpha.22")).toBe(SKILL_SOURCE_V1_TREE);
		expect(getDefaultSkillSource("1.0.0-rc.1")).toBe(SKILL_SOURCE_V1_TREE);
	});

	it("uses the short repo form for stable versions", () => {
		expect(getDefaultSkillSource("1.0.0")).toBe(SKILL_SOURCE_REPO);
		expect(getDefaultSkillSource("1.2.3")).toBe(SKILL_SOURCE_REPO);
	});
});
