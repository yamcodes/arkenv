import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { arkenv, createEnv } from "./create-env";
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

			const env = arkenv(Env, {
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

	describe("defaults and empty strings", () => {
		it("should use defaults when value is missing", () => {
			const env = createEnv({ FOO: "string = 'bar'" }, { env: {} });
			expect(env.FOO).toBe("bar");
		});

		it("should treat empty string as empty string for string types", () => {
			const env = createEnv({ VAL: "string" }, { env: { VAL: "" } });
			expect(env.VAL).toBe("");
		});

		it("should throw for empty string when number is expected", () => {
			expect(() =>
				createEnv({ VAL: "number" }, { env: { VAL: "" } }),
			).toThrow();
		});

		it("should throw for empty string when boolean is expected", () => {
			expect(() =>
				createEnv({ VAL: "boolean" }, { env: { VAL: "" } }),
			).toThrow();
		});

		it("should allow empty strings when the schema is unknown", () => {
			const env = createEnv({ VAL: "unknown" }, { env: { VAL: "" } });
			expect(env.VAL).toBe("");
		});
	});

	describe("standard array syntax", () => {
		it("should parse string[] from comma-separated string", () => {
			const env = createEnv(
				{ TAGS: "string[]" },
				{ env: { TAGS: "foo,bar,baz" } },
			);
			expect(env.TAGS).toEqual(["foo", "bar", "baz"]);
		});

		it("should parse number[] from comma-separated string", () => {
			const env = createEnv(
				{ PORTS: "number[]" },
				{ env: { PORTS: "3000, 8080" } },
			);
			expect(env.PORTS).toEqual([3000, 8080]);
		});

		it("should parse boolean[] from comma-separated string", () => {
			const env = createEnv(
				{ FLAGS: "boolean[]" },
				{ env: { FLAGS: "true, false" } },
			);
			expect(env.FLAGS).toEqual([true, false]);
		});

		it("should parse (string|number)[] from mixed string", () => {
			const env = createEnv(
				{ MIXED: "(string|number)[]" },
				{ env: { MIXED: "foo, 123, bar" } },
			);
			expect(env.MIXED).toEqual(["foo", 123, "bar"]);
		});

		it("should parse (string|number)[] with only numbers", () => {
			const env = createEnv(
				{ MIXED: "(string|number)[]" },
				{ env: { MIXED: "1, 2, 3" } },
			);
			expect(env.MIXED).toEqual([1, 2, 3]);
		});

		it("should parse (string|boolean)[] with mixed values", () => {
			const env = createEnv(
				{ MIXED: "(string|boolean)[]" },
				{ env: { MIXED: "true, foo, false" } },
			);
			expect(env.MIXED).toEqual([true, "foo", false]);
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

			const env = arkenv(Env);

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

			const env = arkenv(Env);

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
			const env1 = arkenv(Env, {
				env: {
					TEST_STRING: "first",
				},
			});
			const env2 = arkenv(Env, {
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

			expect(() => arkenv(Env)).toThrow(/INVALID_PORT/);
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

			const env = arkenv(Env, { env: customEnv });

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
					},
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
					},
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
						},
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
					},
					onUndeclaredKey: "delete",
				},
			);
			expect(env).toEqual({ HOST: "localhost" });
			expect(Object.keys(env)).not.toContain("EXTRA");
		});
	});

	describe("array format configuration", () => {
		it("should parse arrays as JSON when arrayFormat is 'json'", () => {
			const env = createEnv(
				{ TAGS: "string[]" },
				{
					env: { TAGS: '["foo", "bar"]' },
					arrayFormat: "json",
				},
			);
			expect(env.TAGS).toEqual(["foo", "bar"]);
		});

		it("should fail validation if arrayFormat is 'json' but value is not valid JSON array", () => {
			expect(() => {
				createEnv(
					{ TAGS: "string[]" },
					{
						env: { TAGS: "foo,bar" }, // Comma separated, not JSON
						arrayFormat: "json",
					},
				);
			}).toThrow("must be an array");
		});

		it("should default to comma separation", () => {
			const env = createEnv(
				{ TAGS: "string[]" },
				{
					env: { TAGS: "foo,bar" },
					// arrayFormat not specified
				},
			);
			expect(env.TAGS).toEqual(["foo", "bar"]);
		});

		it("should parse numeric arrays as JSON", () => {
			const env = createEnv(
				{ NUMBERS: "number[]" },
				{
					env: { NUMBERS: "[1, 2, 3]" },
					arrayFormat: "json",
				},
			);
			expect(env.NUMBERS).toEqual([1, 2, 3]);
		});

		it("should handle empty comma-separated string", () => {
			const env = createEnv({ TAGS: "string[]" }, { env: { TAGS: "" } });
			expect(env.TAGS).toEqual([]);
		});

		it("should handle single-element array", () => {
			const env = createEnv(
				{ TAGS: "string[]" },
				{ env: { TAGS: "only-one" } },
			);
			expect(env.TAGS).toEqual(["only-one"]);
		});

		it("should handle empty JSON array", () => {
			const env = createEnv(
				{ TAGS: "string[]" },
				{
					env: { TAGS: "[]" },
					arrayFormat: "json",
				},
			);
			expect(env.TAGS).toEqual([]);
		});
	});

	describe("object coercion", () => {
		it("should parse an object from a JSON string", () => {
			const env = createEnv(
				{ DATABASE: { HOST: "string", PORT: "number" } },
				{
					env: {
						DATABASE: '{"HOST": "localhost", "PORT": "5432"}',
					},
				},
			);
			expect(env.DATABASE).toEqual({ HOST: "localhost", PORT: 5432 });
			expect(env.DATABASE.HOST).toBe("localhost");
			expect(env.DATABASE.PORT).toBe(5432);
		});

		it("should handle nested object coercion", () => {
			const env = createEnv(
				{ CONFIG: { DB: { PORT: "number" }, APP: { NAME: "string" } } },
				{
					env: {
						CONFIG: '{"DB": {"PORT": "8080"}, "APP": {"NAME": "myapp"}}',
					},
				},
			);
			expect(env.CONFIG).toEqual({
				DB: { PORT: 8080 },
				APP: { NAME: "myapp" },
			});
		});

		it("should fail validation if object is not valid JSON", () => {
			expect(() => {
				createEnv(
					{ DATABASE: { HOST: "string" } },
					{ env: { DATABASE: '{"HOST": "localhost"' } }, // Missing closing brace
				);
			}).toThrow("must be an object");
		});

		it("should parse objects within arrays", () => {
			const env = createEnv(
				{ SERVICES: type({ NAME: "string", PORT: "number" }).array() },
				{
					env: {
						SERVICES:
							'[{"NAME": "web", "PORT": "80"}, {"NAME": "api", "PORT": "3000"}]',
					},
					arrayFormat: "json",
				},
			);
			expect(env.SERVICES).toEqual([
				{ NAME: "web", PORT: 80 },
				{ NAME: "api", PORT: 3000 },
			]);
		});
	});

	describe("migration & hybrid support", () => {
		it("should support mixed ArkType DSL and Standard Schema validators", () => {
			const env = arkenv(
				{
					PORT: "number.port",
					HOST: z.string().min(1),
				},
				{
					env: { PORT: "3000", HOST: "localhost" },
				},
			);

			expect(env).toEqual({ PORT: 3000, HOST: "localhost" });
		});

		it("should work with top-level Standard Schema", () => {
			const env = arkenv(z.object({ PORT: z.coerce.number() }), {
				env: { PORT: "8080" },
			});
			expect(env.PORT).toBe(8080);
		});
	});
});
