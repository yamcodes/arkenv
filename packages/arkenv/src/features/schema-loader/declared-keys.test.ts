import { describe, expect, it } from "vitest";
import {
	declaredKeyName,
	declaredKeysFromDefinitions,
	schemaHasDefault,
} from "./declared-keys";

describe("declaredKeysFromDefinitions", () => {
	it("preserves declaration order and default metadata", () => {
		const { keys, schema } = declaredKeysFromDefinitions([
			{
				DATABASE_URL: "string",
				"PORT?": "number = 3000",
				CI: "boolean = false",
			},
		]);

		expect(keys.map((key) => key.name)).toEqual(["DATABASE_URL", "PORT", "CI"]);
		expect(keys.map((key) => key.hasDefault)).toEqual([false, true, true]);
		expect(schema.PORT).toBe("number = 3000");
	});

	it("merges multiple captured definitions in call order", () => {
		const { keys } = declaredKeysFromDefinitions([
			{ FIRST: "string" },
			{ SECOND: "string" },
		]);
		expect(keys.map((key) => key.name)).toEqual(["FIRST", "SECOND"]);
	});
});

describe("schemaHasDefault", () => {
	it("detects ArkType default syntax", () => {
		expect(schemaHasDefault("number = 3000")).toBe(true);
		expect(schemaHasDefault("string")).toBe(false);
		expect(schemaHasDefault("boolean = false")).toBe(true);
	});

	it("detects Zod default wrappers", () => {
		expect(
			schemaHasDefault({
				_def: { typeName: "ZodDefault", innerType: { _def: {} } },
			}),
		).toBe(true);
		expect(
			schemaHasDefault({
				_zod: { def: { type: "default", innerType: {} } },
			}),
		).toBe(true);
	});
});

describe("declaredKeyName", () => {
	it("strips a trailing optional marker", () => {
		expect(declaredKeyName("PORT?")).toBe("PORT");
		expect(declaredKeyName("PORT")).toBe("PORT");
	});
});
