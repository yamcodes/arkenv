import { describe, expect, it } from "vitest";
import { stripEmptyStrings } from "./shared";

describe("stripEmptyStrings", () => {
	it("should remove keys with empty string values", () => {
		const env = { A: "", B: "value", C: "" };
		const result = stripEmptyStrings(env);
		expect(result).toEqual({ B: "value" });
	});

	it("should preserve keys with undefined values", () => {
		const env = { A: undefined, B: "value" };
		const result = stripEmptyStrings(env);
		expect(result).toEqual({ A: undefined, B: "value" });
	});

	it("should return a new object", () => {
		const env = { A: "value" };
		const result = stripEmptyStrings(env);
		expect(result).not.toBe(env);
	});
});
