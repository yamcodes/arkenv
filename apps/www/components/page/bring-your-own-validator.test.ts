import { describe, expect, it } from "vitest";
import { BYOV_CODE } from "./bring-your-own-validator";

describe("Bring your own validator snippet", () => {
	it("mixes ArkType, Zod, and Valibot in one schema", () => {
		expect(BYOV_CODE).toContain('from "@arkenv/core"');
		expect(BYOV_CODE).not.toContain("@arkenv/standard");
		expect(BYOV_CODE).not.toContain('from "arktype"');
		expect(BYOV_CODE).toContain('from "zod"');
		expect(BYOV_CODE).toContain('from "valibot"');
		expect(BYOV_CODE).toContain("NODE_ENV");
		expect(BYOV_CODE).toContain("DATABASE_URL");
		expect(BYOV_CODE).toContain("DEBUG");
		expect(BYOV_CODE).not.toContain("PORT");
		expect(BYOV_CODE).not.toContain("LOG_LEVEL");
		expect(BYOV_CODE).not.toContain("type(");
		expect(BYOV_CODE).not.toContain("z.coerce");
		expect(BYOV_CODE).toContain("v.pipe(v.string(), v.url())");
		expect(BYOV_CODE).toContain("z.boolean()");
		expect(BYOV_CODE).toContain("// ---cut---");
	});
});
