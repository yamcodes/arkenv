import { describe, expect, it } from "vitest";
import { createEnv } from "./create-env";
import { type } from "./index";

describe("coercion integration", () => {
	it("should coerce and validate numbers", () => {
		const env = createEnv({ PORT: "number" }, { PORT: "3000" });
		expect(env.PORT).toBe(3000);
		expect(typeof env.PORT).toBe("number");
	});

	it("should coerce and validate booleans", () => {
		const env = createEnv(
			{ DEBUG: "boolean", VERBOSE: "boolean" },
			{ DEBUG: "true", VERBOSE: "false" },
		);
		expect(env.DEBUG).toBe(true);
		expect(env.VERBOSE).toBe(false);
	});

	it("should coerce and validate number subtypes (port)", () => {
		const env = createEnv({ PORT: "number.port" }, { PORT: "8080" });
		expect(env.PORT).toBe(8080);
	});

	it("should fail validation if coercion fails (not a number)", () => {
		expect(() => createEnv({ PORT: "number" }, { PORT: "abc" })).toThrow();
	});

	it("should fail validation if value is valid number but invalid subtype", () => {
		expect(() =>
			createEnv(
				{ PORT: "number.port" },
				{ PORT: "99999" }, // Too large for port
			),
		).toThrow();
	});

	it("should work with mixed coerced and non-coerced values", () => {
		const env = createEnv(
			{
				PORT: "number",
				HOST: "string",
				DEBUG: "boolean",
			},
			{
				PORT: "3000",
				HOST: "localhost",
				DEBUG: "true",
			},
		);
		expect(env.PORT).toBe(3000);
		expect(env.HOST).toBe("localhost");
		expect(env.DEBUG).toBe(true);
	});

	it("should coerce when using compiled type definitions", () => {
		const schema = type({ PORT: "number" });
		const env = createEnv(schema, { PORT: "3000" });
		expect(env.PORT).toBe(3000);
		expect(typeof env.PORT).toBe("number");
	});

	it("should coerce compiled number subtypes", () => {
		const schema = type({
			PORT: "number.port",
			COUNT: "number.integer",
		});
		const env = createEnv(schema, { PORT: "8080", COUNT: "123" });
		expect(env.PORT).toBe(8080);
		expect(env.COUNT).toBe(123);
	});

	it("should fail compiled type validation if coercion fails", () => {
		const schema = type({ PORT: "number" });
		expect(() => createEnv(schema, { PORT: "abc" })).toThrow();
	});

	it("should work with other number sub-keywords like epoch", () => {
		const ts = "1678886400000";
		const env = createEnv({ TS: "number.epoch" }, { TS: ts });
		expect(env.TS).toBe(1678886400000);
	});

	it("should accept natural number inputs without coercion", () => {
		const t = type("number");
		expect(t(123)).toBe(123);

		const tInt = type("number.integer");
		expect(tInt(456)).toBe(456);

		const tBool = type("boolean");
		expect(tBool(true)).toBe(true);
		expect(tBool(false)).toBe(false);
	});

	it("should coerce and validate strict number literals", () => {
		const env = createEnv({ VAL: "1 | 2" }, { VAL: "1" });
		expect(env.VAL).toBe(1);
	});

	it("should coerce and validate strict boolean literals", () => {
		const env = createEnv({ DEBUG: "true" }, { DEBUG: "true" });
		expect(env.DEBUG).toBe(true);
	});

	it("should NOT coerce empty or whitespace strings to 0 for numbers", () => {
		expect(() => createEnv({ VAL: "number" }, { VAL: "" })).toThrow();
		expect(() => createEnv({ VAL: "number" }, { VAL: "  " })).toThrow();
	});

	it("should fail validation if coercion fails (not a boolean)", () => {
		expect(() => createEnv({ DEBUG: "boolean" }, { DEBUG: "yes" })).toThrow();
		expect(() => createEnv({ DEBUG: "boolean" }, { DEBUG: "1" })).toThrow();
	});
});
