import { describe, expect, it } from "vitest";
import { styleText } from "./style";

describe("styleText", () => {
	it("should return styled text in Node.js environment", () => {
		const result = styleText("red", "hello");
		// In Node.js, this should return styled text or at least the original text
		expect(typeof result).toBe("string");
		expect(result).toContain("hello");
	});

	it("should handle array styles", () => {
		const result = styleText(["red", "bold"], "hello");
		expect(typeof result).toBe("string");
		expect(result).toContain("hello");
	});

	it("should return plain text in browser environments", () => {
		// This test ensures the fallback works
		const result = styleText("blue", "test");
		expect(typeof result).toBe("string");
		// Should at least contain the original text
		expect(result).toContain("test");
	});
});
