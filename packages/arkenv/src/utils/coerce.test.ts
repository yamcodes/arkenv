import { type } from "arktype";
import { describe, expect, it } from "vitest";
import { coerce } from "./coerce";

describe("coerce", () => {
	it("should coerce numeric properties", () => {
		const schema = type({
			PORT: "number",
		});
		const coercedSchema = coerce(schema);
		const result = coercedSchema({ PORT: "3000" });
		expect(result).toEqual({ PORT: 3000 });
	});

	it("should coerce numeric ranges", () => {
		const schema = type({
			AGE: "number >= 18",
		});
		const coercedSchema = coerce(schema);
		const result = coercedSchema({ AGE: "21" });
		expect(result).toEqual({ AGE: 21 });

		const failure = coercedSchema({ AGE: "15" });
		expect(failure.toString()).toContain("AGE must be at least 18 (was 15)");
	});

	it("should coerce numeric divisors", () => {
		const schema = type({
			EVEN: "number % 2",
		});
		const coercedSchema = coerce(schema);
		const result = coercedSchema({ EVEN: "4" });
		expect(result).toEqual({ EVEN: 4 });

		const failure = coercedSchema({ EVEN: "3" });
		expect(failure.toString()).toContain("EVEN must be even (was 3)");
	});

	it("should coerce boolean properties", () => {
		const schema = type({
			DEBUG: "boolean",
		});
		const coercedSchema = coerce(schema);
		expect(coercedSchema({ DEBUG: "true" })).toEqual({ DEBUG: true });
		expect(coercedSchema({ DEBUG: "false" })).toEqual({ DEBUG: false });
	});

	it("should work with optional properties", () => {
		const schema = type({
			"PORT?": "number",
		});
		const coercedSchema = coerce(schema);
		expect(coercedSchema({ PORT: "3000" })).toEqual({ PORT: 3000 });
		expect(coercedSchema({})).toEqual({});
	});

	it("should work with root-level primitives", () => {
		const schema = type("number >= 10");
		const coercedSchema = coerce(schema);
		expect(coercedSchema("20")).toBe(20);
		const failure = coercedSchema("5");
		expect(failure.toString()).toContain("must be at least 10 (was 5)");
	});
});
