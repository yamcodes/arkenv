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

	it("should NOT coerce if using compiled types", () => {
		// This documents the limitation
		const schema = type({ PORT: "number" });
		expect(() => createEnv(schema, { PORT: "3000" })).toThrow(); // "3000" is a string, schema expects number, no coercion happens
	});
});
