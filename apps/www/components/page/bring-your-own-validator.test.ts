import { describe, expect, it } from "vitest";
import { BYOV_EXAMPLES } from "./bring-your-own-validator";

describe("Bring your own validator snippets", () => {
	it("shows ArkType, Zod, and Valibot as git-diffs of the same keys", () => {
		expect(BYOV_EXAMPLES.map((example) => example.id)).toEqual([
			"arktype",
			"zod",
			"valibot",
		]);

		for (const example of BYOV_EXAMPLES) {
			expect(example.code).toContain("NODE_ENV");
			expect(example.code).toContain("DATABASE_URL");
			expect(example.code).toContain("LOG_LEVEL");
			expect(example.code).not.toContain("PORT");
			expect(example.code).not.toContain("number.port");
			expect(example.code).not.toContain("toNumber");
		}
	});

	it("keeps Valibot on picklists and URLs, not numeric coercion", () => {
		const valibot = BYOV_EXAMPLES.find((example) => example.id === "valibot");
		expect(valibot?.code).toContain("v.picklist");
		expect(valibot?.code).toContain("v.pipe(v.string(), v.url())");
		expect(valibot?.code).not.toContain("v.toNumber");
		expect(valibot?.code).not.toContain("v.integer");
	});
});
