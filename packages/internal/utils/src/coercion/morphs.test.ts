import { describe, expect, it } from "vitest";
import { coerceBoolean, coerceJson, coerceNumber } from "./morphs";

describe("Morph Functions", () => {
	describe("coerceNumber", () => {
		it("should return numbers as-is", () => {
			expect(coerceNumber(42)).toBe(42);
			expect(coerceNumber(0)).toBe(0);
			expect(coerceNumber(-5.5)).toBe(-5.5);
		});

		it("should convert numeric strings to numbers", () => {
			expect(coerceNumber("42")).toBe(42);
			expect(coerceNumber("0")).toBe(0);
			expect(coerceNumber("-5.5")).toBe(-5.5);
			expect(coerceNumber("  123  ")).toBe(123);
		});

		it("should handle NaN string", () => {
			expect(coerceNumber("NaN")).toBeNaN();
		});

		it("should return non-numeric strings as-is", () => {
			expect(coerceNumber("hello")).toBe("hello");
			expect(coerceNumber("not a number")).toBe("not a number");
		});

		it("should return empty strings as-is", () => {
			expect(coerceNumber("")).toBe("");
			expect(coerceNumber("   ")).toBe("   ");
		});

		it("should return non-string, non-number values as-is", () => {
			const obj = { foo: "bar" };
			expect(coerceNumber(obj)).toBe(obj);
			expect(coerceNumber(null)).toBe(null);
			expect(coerceNumber(undefined)).toBe(undefined);
		});
	});

	describe("coerceBoolean", () => {
		it("should convert 'true' string to boolean true", () => {
			expect(coerceBoolean("true")).toBe(true);
		});

		it("should convert 'false' string to boolean false", () => {
			expect(coerceBoolean("false")).toBe(false);
		});

		it("should return other values as-is", () => {
			expect(coerceBoolean("yes")).toBe("yes");
			expect(coerceBoolean("no")).toBe("no");
			expect(coerceBoolean("1")).toBe("1");
			expect(coerceBoolean("0")).toBe("0");
			expect(coerceBoolean(true)).toBe(true);
			expect(coerceBoolean(false)).toBe(false);
			expect(coerceBoolean(42)).toBe(42);
		});
	});

	describe("coerceJson", () => {
		it("should parse valid JSON objects", () => {
			expect(coerceJson('{"foo":"bar"}')).toEqual({ foo: "bar" });
			expect(coerceJson('  {"nested":{"value":123}}  ')).toEqual({
				nested: { value: 123 },
			});
		});

		it("should parse valid JSON arrays", () => {
			expect(coerceJson("[1,2,3]")).toEqual([1, 2, 3]);
			expect(coerceJson('["a","b","c"]')).toEqual(["a", "b", "c"]);
		});

		it("should return non-JSON strings as-is", () => {
			expect(coerceJson("hello")).toBe("hello");
			expect(coerceJson("not json")).toBe("not json");
		});

		it("should return strings that don't start with { or [ as-is", () => {
			expect(coerceJson("plain text")).toBe("plain text");
			expect(coerceJson("  plain text  ")).toBe("  plain text  ");
		});

		it("should return invalid JSON as-is", () => {
			expect(coerceJson("{invalid}")).toBe("{invalid}");
			expect(coerceJson("[broken")).toBe("[broken");
		});

		it("should return non-string values as-is", () => {
			expect(coerceJson(42)).toBe(42);
			expect(coerceJson(true)).toBe(true);
			const obj = { foo: "bar" };
			expect(coerceJson(obj)).toBe(obj);
		});
	});
});
