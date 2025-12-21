import { type } from "arktype";
import { describe, expect, it } from "vitest";

/**
 * This test suite acts as a "Contract Test" for ArkType internals.
 * Since arkenv relies on undocumented ArkType properties for its magic coercion,
 * we use this suite to catch breaking internal changes in ArkType early.
 */
describe("ArkType Internal Contract", () => {
	it("should have expected internal properties for primitives", () => {
		const node = type("number").internal as any;
		expect(node).toHaveProperty("kind");
		expect(node).toHaveProperty("domain");
		expect(node.domain).toBe("number");
	});

	it("should have expected internal properties for intersections (e.g. number.integer)", () => {
		const node = type("number.integer").internal as any;
		expect(node).toHaveProperty("kind");
		expect(node.kind).toBe("intersection");
		expect(node).toHaveProperty("basis");
		expect(node.basis.domain).toBe("number");
	});

	it("should have expected internal properties for unions", () => {
		const node = type("number | boolean").internal as any;
		expect(node.kind).toBe("union");
		expect(node).toHaveProperty("branches");
		expect(Array.isArray(node.branches)).toBe(true);
	});

	it("should have expected internal properties for literals", () => {
		const node = type("1").internal as any;
		expect(node.kind).toBe("unit");
		expect(node).toHaveProperty("unit");
		expect(node.unit).toBe(1);
	});

	it("should support the .transform() method on types", () => {
		const t = type({ a: "number" });
		expect(typeof (t as any).transform).toBe("function");
	});

	it("should support .internal on keyword types", () => {
		const t = type("string.numeric.parse");
		expect((t as any).internal).toBeDefined();
	});
});
