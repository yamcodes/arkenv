import { describe, expect, it } from "vitest";
import { coerce } from "./coerce";

describe("coerce", () => {
	it("should coerce number strings", () => {
		const def = { PORT: "number" };
		const env = { PORT: "3000" };
		const result = coerce(def, env);
		expect(result.PORT).toBe(3000);
	});

	it("should coerce number subtypes", () => {
		const def = { TIMESTAMP: "number.epoch" };
		const env = { TIMESTAMP: "1640995200000" };
		const result = coerce(def, env);
		expect(result.TIMESTAMP).toBe(1640995200000);
	});

	it("should coerce boolean 'true'", () => {
		const def = { DEBUG: "boolean" };
		const env = { DEBUG: "true" };
		const result = coerce(def, env);
		expect(result.DEBUG).toBe(true);
	});

	it("should coerce boolean 'false'", () => {
		const def = { DEBUG: "boolean" };
		const env = { DEBUG: "false" };
		const result = coerce(def, env);
		expect(result.DEBUG).toBe(false);
	});

	it("should pass through non-coercible values", () => {
		const def = { API_KEY: "string" };
		const env = { API_KEY: "12345" };
		const result = coerce(def, env);
		expect(result.API_KEY).toBe("12345");
	});

	it("should pass through values that fail number coercion", () => {
		const def = { PORT: "number" };
		const env = { PORT: "not-a-number" };
		const result = coerce(def, env);
		expect(result.PORT).toBe("not-a-number");
	});

	it("should pass through values that fail boolean coercion", () => {
		const def = { DEBUG: "boolean" };
		const env = { DEBUG: "yes" };
		const result = coerce(def, env);
		expect(result.DEBUG).toBe("yes");
	});

	it("should handle undefined values", () => {
		const def = { PORT: "number" };
		const env = { PORT: undefined };
		const result = coerce(def, env);
		expect(result.PORT).toBeUndefined();
	});

	it("should ignore keys not in definition", () => {
		const def = { PORT: "number" };
		const env = { PORT: "3000", EXTRA: "foo" };
		const result = coerce(def, env);
		expect(result.PORT).toBe(3000);
		expect(result.EXTRA).toBe("foo");
	});
});
