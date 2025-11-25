import { describe, expect, it } from "vitest";
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

describe("env", () => {
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
			env,
		);

		expect(TEST_STRING).toBe("hello");
	});

	it("should support array types with default values", () => {
		const env = createEnv(
			{
				NUMBERS: type("number[]").default(() => [1, 2, 3]),
				STRINGS: type("string[]").default(() => ["a", "b"]),
			},
			{},
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
			{},
		);

		expect(env.NUMBERS).toEqual([1, 2, 3]);
	});

	describe("type definitions", () => {
		it("should accept type definitions created with type()", () => {
			process.env.TEST_STRING = "hello";
			process.env.TEST_PORT = "3000";

			const envSchema = type({
				TEST_STRING: "string",
				TEST_PORT: "number.port",
			});

			const env = createEnv(envSchema);

			expect(env.TEST_STRING).toBe("hello");
			expect(env.TEST_PORT).toBe(3000);
		});

		it("should provide correct type inference with type definitions", () => {
			process.env.TEST_STRING = "hello";
			process.env.TEST_PORT = "3000";

			const envSchema = type({
				TEST_STRING: "string",
				TEST_PORT: "number.port",
			});

			const env = createEnv(envSchema);

			// TypeScript should infer these correctly
			const str: string = env.TEST_STRING;
			const port: number = env.TEST_PORT;

			expect(str).toBe("hello");
			expect(port).toBe(3000);
		});

		it("should allow reusing the same type definition multiple times", () => {
			process.env.TEST_STRING = "hello";

			const envSchema = type({
				TEST_STRING: "string",
			});

			// Use the same schema multiple times
			const env1 = createEnv(envSchema, { TEST_STRING: "first" });
			const env2 = createEnv(envSchema, { TEST_STRING: "second" });

			expect(env1.TEST_STRING).toBe("first");
			expect(env2.TEST_STRING).toBe("second");
		});

		it("should throw when type definition validation fails", () => {
			process.env.INVALID_PORT = "not-a-port";

			const envSchema = type({
				INVALID_PORT: "number.port",
			});

			expect(() => createEnv(envSchema)).toThrow(/INVALID_PORT/);
		});

		it("should work with custom environment and type definitions", () => {
			const envSchema = type({
				HOST: "string.host",
				PORT: "number.port",
			});

			const customEnv = {
				HOST: "localhost",
				PORT: "8080",
			};

			const env = createEnv(envSchema, customEnv);

			expect(env.HOST).toBe("localhost");
			expect(env.PORT).toBe(8080);
		});
	});
});
