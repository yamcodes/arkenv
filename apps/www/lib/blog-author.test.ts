import { describe, expect, it } from "vitest";
import { getAuthorAvatarUrl, getAuthorGithub } from "./blog-author";

describe("blog-author", () => {
	it("resolves explicit authorGithub", () => {
		expect(getAuthorGithub("Yam Borodetsky", "yamcodes")).toBe("yamcodes");
		expect(getAuthorGithub("Someone Else", "@custom-user")).toBe("custom-user");
	});

	it("resolves known authors without explicit authorGithub", () => {
		expect(getAuthorGithub("Yam Borodetsky")).toBe("yamcodes");
		expect(getAuthorGithub("yamcodes")).toBe("yamcodes");
	});

	it("extracts inline @handle from author name", () => {
		expect(getAuthorGithub("Jane Doe (@janedoe)")).toBe("janedoe");
	});

	it("returns undefined for unknown author without github handle", () => {
		expect(getAuthorGithub("Unknown Contributor")).toBeUndefined();
	});

	it("generates avatar url", () => {
		expect(getAuthorAvatarUrl("yamcodes", 32)).toBe(
			"https://github.com/yamcodes.png?size=32",
		);
	});
});
