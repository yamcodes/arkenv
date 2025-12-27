import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEnv } from "./create-env";
import { type } from "./type";
import { indent, styleText } from "./utils";

/**
 * Format the errors returned by env for testing purposes
 * @param errors - The errors returned by env
 * @returns A string of the formatted errors
 */
const expectedError = (
	errors: {
		requiredType: string;
		providedType: string;
		name: string;
	}[],
) => {
	const formattedErrors = errors.map((error) => {
		return `${styleText("red", "Errors found while validating environment variables")}\n${indent(
			`${styleText("yellow", error.name)} must be ${error.requiredType} (was ${error.providedType})`,
		)}\n`;
	});

	return formattedErrors.join("\n");
};

describe("createEnv", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
	});

	afterEach(() => {
		process.env = originalEnv;
	});
	describe("coercion", () => {
		it("should coerce number from string", () => {
			const env = createEnv({ PORT: "number" }, { env: { PORT: "3000" } });
			expect(env.PORT).toBe(3000);
			expect(typeof env.PORT).toBe("number");
		});

		it("should coerce boolean from string", () => {
			const env = createEnv(
				{ DEBUG: "boolean", VERBOSE: "boolean" },
				{ env: { DEBUG: "true", VERBOSE: "false" } },
			);
			expect(env.DEBUG).toBe(true);
			expect(env.VERBOSE).toBe(false);
		});

		it("should coerce number.integer from string", () => {
			const env = createEnv(
				{ COUNT: "number.integer" },
				{ env: { COUNT: "123" } },
			);
			expect(env.COUNT).toBe(123);
		});

		it("should coerce numeric ranges from string", () => {
			const env = createEnv({ AGE: "number >= 18" }, { env: { AGE: "21" } });
			expect(env.AGE).toBe(21);
		});

		it("should coerce numeric divisors from string", () => {
			const env = createEnv({ EVEN: "number % 2" }, { env: { EVEN: "4" } });
			expect(env.EVEN).toBe(4);
		});

		it("should work with optional coerced properties", () => {
			const schema = { "PORT?": "number" } as const;
			expect(createEnv(schema, { env: { PORT: "3000" } }).PORT).toBe(3000);
			expect(createEnv(schema, { env: {} }).PORT).toBeUndefined();
		});

		it("should coerce strict number literals", () => {
			const schema = { VAL: "1 | 2" } as const;
			expect(createEnv(schema, { env: { VAL: "1" } }).VAL).toBe(1);
		});

		it("should work with schemas containing morphs", () => {
			const Env = type({
				PORT: "number.port",
				VITE_MY_NUMBER_MANUAL: type("string").pipe((str) =>
					Number.parseInt(str, 10),
				),
			});

			const env = createEnv(Env, {
				env: {
					PORT: "3000",
					VITE_MY_NUMBER_MANUAL: "456",
				},
			});

			expect(env.PORT).toBe(3000);
			expect(env.VITE_MY_NUMBER_MANUAL).toBe(456);
		});
	});

	describe("numeric keywords", () => {
		it("should coerce number", () => {
			const env = createEnv({ VAL: "number" }, { env: { VAL: "123.456" } });
			expect(env.VAL).toBe(123.456);
		});

		it("should coerce number.Infinity", () => {
			const env = createEnv(
				{ VAL: "number.Infinity" },
				{ env: { VAL: "Infinity" } },
			);
			expect(env.VAL).toBe(Number.POSITIVE_INFINITY);
		});

		// TODO: Support NaN coercion
		// it("should coerce number.NaN", () => {
		// 	const env = createEnv({ VAL: "number.NaN" }, { VAL: "NaN" });
		// 	expect(env.VAL).toBeNaN();
		// });

		it("should coerce number.NegativeInfinity", () => {
			const env = createEnv(
				{ VAL: "number.NegativeInfinity" },
				{ env: { VAL: "-Infinity" } },
			);
			expect(env.VAL).toBe(Number.NEGATIVE_INFINITY);
		});

		it("should coerce number.epoch", () => {
			const env = createEnv(
				{ VAL: "number.epoch" },
				{ env: { VAL: "1640995200000" } },
			);
			expect(env.VAL).toBe(1640995200000);
		});

		it("should coerce number.integer", () => {
			const env = createEnv({ VAL: "number.integer" }, { env: { VAL: "42" } });
			expect(env.VAL).toBe(42);
		});

		it("should coerce number.safe", () => {
			const env = createEnv(
				{ VAL: "number.safe" },
				{ env: { VAL: "9007199254740991" } },
			);
			expect(env.VAL).toBe(Number.MAX_SAFE_INTEGER);
		});
	});

	it("should validate string env variables", () => {
		process.env.TEST_STRING = "hello";

		const env = createEnv({
			TEST_STRING: "string",
		});

		expect(env.TEST_STRING).toBe("hello");
	});

	it("should throw when required env variable is missing", () => {
		expect(() =>
			createEnv({
				MISSING_VAR: "string",
			}),
		).toThrow(
			expectedError([
				{
					requiredType: "a string",
					providedType: "missing",
					name: "MISSING_VAR",
				},
			]),
		);
	});

	it("should throw when env variable has wrong type", () => {
		process.env.WRONG_TYPE = "not a number";

		expect(() =>
			createEnv({
				WRONG_TYPE: "number",
			}),
		).toThrow(
			expectedError([
				{
					requiredType: "a number",
					providedType: "a string",
					name: "WRONG_TYPE",
				},
			]),
		);
	});

	it("should validate against a custom environment", () => {
		const env = {
			TEST_STRING: "hello",
		};

		const { TEST_STRING } = createEnv(
			{
				TEST_STRING: "string",
			},
			{ env },
		);

		expect(TEST_STRING).toBe("hello");
	});

	it("should support array types with default values", () => {
		const env = createEnv(
			{
				NUMBERS: type("number[]").default(() => [1, 2, 3]),
				STRINGS: type("string[]").default(() => ["a", "b"]),
			},
			{ env: {} },
		);

		expect(env.NUMBERS).toEqual([1, 2, 3]);
		expect(env.STRINGS).toEqual(["a", "b"]);
	});

	it("should support array types with defaults when no environment value provided", () => {
		// Test default value usage when environment variable is not set
		const env = createEnv(
			{
				NUMBERS: type("number[]").default(() => [1, 2, 3]),
			},
			{ env: {} },
		);

		expect(env.NUMBERS).toEqual([1, 2, 3]);
	});

	describe("type definitions", () => {
		it("should accept type definitions created with type()", () => {
			process.env.TEST_STRING = "hello";
			process.env.TEST_PORT = "3000";

			const Env = type({
				TEST_STRING: "string",
				TEST_PORT: "number.port",
			});

			const env = createEnv(Env);

			expect(env.TEST_STRING).toBe("hello");
			expect(env.TEST_PORT).toBe(3000);
		});

		it("should provide correct type inference with type definitions", () => {
			process.env.TEST_STRING = "hello";
			process.env.TEST_PORT = "3000";

			const Env = type({
				TEST_STRING: "string",
				TEST_PORT: "number.port",
			});

			const env = createEnv(Env);

			// TypeScript should infer these correctly
			const str = env.TEST_STRING;
			const port = env.TEST_PORT;

			expect(str).toBe("hello");
			expect(port).toBe(3000);
		});

		it("should allow reusing the same type definition multiple times", () => {
			process.env.TEST_STRING = "hello";

			const Env = type({
				TEST_STRING: "string",
			});

			// Use the same schema multiple times
			const env1 = createEnv(Env, {
				env: {
					TEST_STRING: "first",
				},
			});
			const env2 = createEnv(Env, {
				env: {
					TEST_STRING: "second",
				},
			});

			expect(env1.TEST_STRING).toBe("first");
			expect(env2.TEST_STRING).toBe("second");
		});

		it("should throw when type definition validation fails", () => {
			process.env.INVALID_PORT = "not-a-port";

			const Env = type({
				INVALID_PORT: "number.port",
			});

			expect(() => createEnv(Env)).toThrow(/INVALID_PORT/);
		});

		it("should work with custom environment and type definitions", () => {
			const Env = type({
				HOST: "string.host",
				PORT: "number.port",
			});

			const customEnv = {
				HOST: "localhost",
				PORT: "8080",
			};

			const env = createEnv(Env, { env: customEnv });

			expect(env.HOST).toBe("localhost");
			expect(env.PORT).toBe(8080);
		});
	});

	describe("options", () => {
		it("should disable coercion when coerce is set to false", () => {
			expect(() =>
				createEnv(
					{
						NUMBER: "number",
					},
					{
						env: {
							NUMBER: "123",
						},
						coerce: false,
					},
				),
			).toThrow();
		});

		it("should allow disabling coercion when using process.env (2nd arg)", () => {
			const originalEnv = process.env;
			process.env = { ...originalEnv, TEST_NUM: "123" };
			try {
				expect(() =>
					createEnv({ TEST_NUM: "number" }, { coerce: false }),
				).toThrow();
			} finally {
				process.env = originalEnv;
			}
		});

		it("should allow string values when coercion is disabled if schema expects strings", () => {
			const env = createEnv(
				{
					VAL: "string",
				},
				{
					env: {
						VAL: "123",
					},
					coerce: false,
				},
			);
			expect(env.VAL).toBe("123");
		});

		it("should strip extra keys that are not defined in the schema by default", () => {
			const env = createEnv(
				{ HOST: "string" },
				{
					env: {
						HOST: "localhost",
						EXTRA: "should-be-deleted",
					} as any,
				},
			);
			expect(env).toEqual({ HOST: "localhost" });
			expect(Object.keys(env)).not.toContain("EXTRA");
		});

		it("should preserve extra keys when onUndeclaredKey is set to 'ignore'", () => {
			const env = createEnv(
				{ HOST: "string" },
				{
					env: {
						HOST: "localhost",
						EXTRA: "should-be-preserved",
					} as any,
					onUndeclaredKey: "ignore",
				},
			);
			expect(env).toEqual({ HOST: "localhost", EXTRA: "should-be-preserved" });
		});

		it("should throw when onUndeclaredKey is set to 'reject' and extra keys are present", () => {
			expect(() =>
				createEnv(
					{ HOST: "string" },
					{
						env: {
							HOST: "localhost",
							EXTRA: "should-cause-fail",
						} as any,
						onUndeclaredKey: "reject",
					},
				),
			).toThrow();
		});

		it("should explicitly delete extra keys when onUndeclaredKey is set to 'delete'", () => {
			const env = createEnv(
				{ HOST: "string" },
				{
					env: {
						HOST: "localhost",
						EXTRA: "should-be-deleted",
					} as any,
					onUndeclaredKey: "delete",
				},
			);
			expect(env).toEqual({ HOST: "localhost" });
			expect(Object.keys(env)).not.toContain("EXTRA");
		});
	});
});
