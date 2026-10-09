import { describe, expect, it } from "vitest";
import { cssColorAlpha, parseDotAlpha, resolveDotFill } from "./dot-grid-color";

describe("cssColorAlpha", () => {
	it("reads the alpha from an oklch mix", () => {
		expect(cssColorAlpha("oklch(0.95 0.01 200 / 0.14)")).toBeCloseTo(0.14);
	});

	it("treats bare oklch and rgb as opaque", () => {
		expect(cssColorAlpha("oklch(0.95 0.01 200)")).toBe(1);
		expect(cssColorAlpha("rgb(231, 241, 241)")).toBe(1);
	});

	it("reads comma rgba and percentage alpha", () => {
		expect(cssColorAlpha("rgba(234, 241, 241, 0.14)")).toBeCloseTo(0.14);
		expect(cssColorAlpha("oklch(0.95 0.01 200 / 14%)")).toBeCloseTo(0.14);
	});

	it("returns null for keywords that are not a paint color", () => {
		expect(cssColorAlpha("")).toBeNull();
		expect(cssColorAlpha("canvastext")).toBeNull();
		expect(cssColorAlpha("transparent")).toBe(0);
	});
});

describe("parseDotAlpha", () => {
	it("accepts the CSS percentage and a unitless fraction", () => {
		expect(parseDotAlpha("14%")).toBeCloseTo(0.14);
		expect(parseDotAlpha("0.14")).toBeCloseTo(0.14);
	});

	it("falls back when the variable is missing or opaque", () => {
		expect(parseDotAlpha("")).toBeCloseTo(0.14);
		expect(parseDotAlpha("100%")).toBeCloseTo(0.14);
		expect(parseDotAlpha("nope")).toBeCloseTo(0.14);
	});
});

describe("resolveDotFill", () => {
	it("keeps a faded computed color so the mix is not applied twice", () => {
		expect(resolveDotFill("oklch(0.95 0.01 200 / 0.14)", 0.14)).toEqual({
			kind: "faded",
			fill: "oklch(0.95 0.01 200 / 0.14)",
			globalAlpha: 1,
		});
	});

	it("fades opaque inherited ink instead of painting solid dots", () => {
		expect(resolveDotFill("oklch(0.95 0.01 200)", 0.14)).toEqual({
			kind: "fallback",
			fill: "oklch(0.95 0.01 200)",
			globalAlpha: 0.14,
		});
		expect(resolveDotFill("rgb(231, 241, 241)", 0.14)).toMatchObject({
			kind: "fallback",
			globalAlpha: 0.14,
		});
	});

	it("does not paint until a real color is available", () => {
		expect(resolveDotFill("canvastext", 0.14)).toBeNull();
		expect(resolveDotFill("transparent", 0.14)).toBeNull();
	});
});
