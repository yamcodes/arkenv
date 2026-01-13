import { describe, expect, it } from "vitest";
import { maybeBooleanFn, maybeJsonFn, maybeNumberFn } from "./morphs";

describe("Morph Functions", () => {
	describe("maybeNumberFn", () => {
		it("should return numbers as-is", () => {
			expect(maybeNumberFn(42)).toBe(42);
			expect(maybeNumberFn(0)).toBe(0);
			expect(maybeNumberFn(-5.5)).toBe(-5.5);
		});

		it("should convert numeric strings to numbers", () => {
			expect(maybeNumberFn("42")).toBe(42);
			expect(maybeNumberFn("0")).toBe(0);
			expect(maybeNumberFn("-5.5")).toBe(-5.5);
			expect(maybeNumberFn("  123  ")).toBe(123);
		});

		it("should handle NaN string", () => {
			expect(maybeNumberFn("NaN")).toBeNaN();
		});

		it("should return non-numeric strings as-is", () => {
			expect(maybeNumberFn("hello")).toBe("hello");
			expect(maybeNumberFn("not a number")).toBe("not a number");
		});

		it("should return empty strings as-is", () => {
			expect(maybeNumberFn("")).toBe("");
			expect(maybeNumberFn("   ")).toBe("   ");
		});

		it("should return non-string, non-number values as-is", () => {
			const obj = { foo: "bar" };
			expect(maybeNumberFn(obj)).toBe(obj);
			expect(maybeNumberFn(null)).toBe(null);
			expect(maybeNumberFn(undefined)).toBe(undefined);
		});
	});

	describe("maybeBooleanFn", () => {
		it("should convert 'true' string to boolean true", () => {
			expect(maybeBooleanFn("true")).toBe(true);
		});

		it("should convert 'false' string to boolean false", () => {
			expect(maybeBooleanFn("false")).toBe(false);
		});

		it("should return other values as-is", () => {
			expect(maybeBooleanFn("yes")).toBe("yes");
			expect(maybeBooleanFn("no")).toBe("no");
			expect(maybeBooleanFn("1")).toBe("1");
			expect(maybeBooleanFn("0")).toBe("0");
			expect(maybeBooleanFn(true)).toBe(true);
			expect(maybeBooleanFn(false)).toBe(false);
			expect(maybeBooleanFn(42)).toBe(42);
		});
	});

	describe("maybeJsonFn", () => {
		it("should parse valid JSON objects", () => {
			expect(maybeJsonFn('{"foo":"bar"}')).toEqual({ foo: "bar" });
			expect(maybeJsonFn('  {"nested":{"value":123}}  ')).toEqual({
				nested: { value: 123 },
			});
		});

		it("should parse valid JSON arrays", () => {
			expect(maybeJsonFn("[1,2,3]")).toEqual([1, 2, 3]);
			expect(maybeJsonFn('["a","b","c"]')).toEqual(["a", "b", "c"]);
		});

		it("should return non-JSON strings as-is", () => {
			expect(maybeJsonFn("hello")).toBe("hello");
			expect(maybeJsonFn("not json")).toBe("not json");
		});

		it("should return strings that don't start with { or [ as-is", () => {
			expect(maybeJsonFn("plain text")).toBe("plain text");
			expect(maybeJsonFn("  plain text  ")).toBe("  plain text  ");
		});

		it("should return invalid JSON as-is", () => {
			expect(maybeJsonFn("{invalid}")).toBe("{invalid}");
			expect(maybeJsonFn("[broken")).toBe("[broken");
		});

		it("should return non-string values as-is", () => {
			expect(maybeJsonFn(42)).toBe(42);
			expect(maybeJsonFn(true)).toBe(true);
			const obj = { foo: "bar" };
			expect(maybeJsonFn(obj)).toBe(obj);
		});
	});
});
