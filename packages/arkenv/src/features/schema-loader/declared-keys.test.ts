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

	it("treats an empty captured object as an empty schema", () => {
		const { keys, schema } = declaredKeysFromDefinitions([{}]);
		expect(keys).toEqual([]);
		expect(schema).toEqual({});
	});

	it("reads defaults from compiled ArkType json entries", () => {
		const compiled = {
			json: {
				domain: "object",
				required: [{ key: "PORT", value: "number" }],
				optional: [{ key: "DATABASE_URL", value: "string", default: "foo" }],
			},
		};
		const { keys, schema } = declaredKeysFromDefinitions([compiled]);
		expect(keys.map((key) => key.name)).toEqual(["PORT", "DATABASE_URL"]);
		expect(keys.map((key) => key.hasDefault)).toEqual([false, true]);
		expect(schema.PORT).toBe("number");
		expect(schema.DATABASE_URL).toBe("string");
	});
});

describe("schemaHasDefault", () => {
	it("detects ArkType default syntax", () => {
		expect(schemaHasDefault("number = 3000")).toBe(true);
		expect(schemaHasDefault("string")).toBe(false);
		expect(schemaHasDefault("boolean = false")).toBe(true);
	});

	it("detects Zod 4 and Zod 3 default wrappers", () => {
		expect(
			schemaHasDefault({
				_def: { type: "default", defaultValue: 3000, innerType: {} },
			}),
		).toBe(true);
		expect(
			schemaHasDefault({
				_def: { typeName: "ZodDefault", innerType: { _def: {} } },
			}),
		).toBe(true);
	});

	it("detects Valibot default and fallback own fields", () => {
		expect(
			schemaHasDefault({
				kind: "schema",
				type: "optional",
				default: "dev",
				"~standard": {},
			}),
		).toBe(true);
		expect(
			schemaHasDefault({
				kind: "schema",
				type: "fallback",
				fallback: "x",
				"~standard": {},
			}),
		).toBe(true);
		expect(
			schemaHasDefault({
				kind: "schema",
				"~standard": {},
			}),
		).toBe(false);
	});
});

describe("declaredKeyName", () => {
	it("strips a trailing optional marker", () => {
		expect(declaredKeyName("PORT?")).toBe("PORT");
		expect(declaredKeyName("PORT")).toBe("PORT");
	});
});
