import { describe, expect, it } from "vitest";
import { indent } from "./indent";

describe("indent", () => {
	it("should indent a string by 2 spaces by default", () => {
		const input = "hello";
		const expected = "  hello";
		expect(indent(input)).toBe(expected);
	});

	it("should indent a string by custom amount", () => {
		const input = "hello";
		const expected = "    hello";
		expect(indent(input, 4)).toBe(expected);
	});

	it("should indent each line of a multiline string", () => {
		const input = "hello\nworld";
		const expected = "  hello\n  world";
		expect(indent(input)).toBe(expected);
	});

	it("should preserve empty lines when indenting multiline strings", () => {
		const input = "hello\n\nworld";
		const expected = "  hello\n  \n  world";
		expect(indent(input)).toBe(expected);
	});

	it("should not detect newlines when dontDetectNewlines is true", () => {
		const input = "hello\nworld";
		const expected = "  hello\nworld";
		expect(indent(input, 2, { dontDetectNewlines: true })).toBe(expected);
	});

	it("should work with zero indentation", () => {
		const input = "hello";
		const expected = "hello";
		expect(indent(input, 0)).toBe(expected);
	});
});
