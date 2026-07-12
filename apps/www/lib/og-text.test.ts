import { describe, expect, it } from "vitest";
import { formatOgDescription, formatOgTitle, truncateOgText } from "./og-text";

describe("og-text", () => {
	it("leaves short text unchanged", () => {
		expect(formatOgTitle("Flat layout")).toBe("Flat layout");
		expect(formatOgDescription("A short description.")).toBe(
			"A short description.",
		);
	});

	it("truncates a long title without affecting a short description", () => {
		const title = formatOgTitle(
			"Zod, Valibot, and other Standard Schema validators",
		);

		expect(title).toBe("Zod, Valibot, and other Standard...");
		expect(title.length).toBeLessThanOrEqual(42);
		expect(formatOgDescription("A short description.")).toBe(
			"A short description.",
		);
	});

	it("truncates a long description without affecting a short title", () => {
		const description = formatOgDescription(
			"Mix and match ArkType with Zod, Valibot, or other Standard Schema compatible libraries.",
		);

		expect(description).toBe(
			"Mix and match ArkType with Zod, Valibot, or other Standard Schema...",
		);
		expect(description.length).toBeLessThanOrEqual(75);
		expect(formatOgTitle("Flat layout")).toBe("Flat layout");
	});

	it("truncates at word boundaries when possible", () => {
		expect(truncateOgText("one two three four five six", 15)).toBe(
			"one two thre...",
		);
	});
});
