import { describe, expect, it } from "vitest";
import { createEnv } from "./create-env";
import { styleText } from "./style";
import { type } from "./type";
import { indent } from "./utils";

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

	it("should validate against a custom environment using options interface", () => {
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

	it("should filter environment variables by prefix", () => {
		const env = {
			BUN_PUBLIC_API_URL: "https://api.example.com",
			BUN_PUBLIC_PORT: "3000",
			PRIVATE_KEY: "secret", // Should be filtered out
		};

		const result = createEnv(
			{
				API_URL: "string",
				PORT: "string", // Changed to string since env vars are always strings
			},
			{ env, prefix: "BUN_PUBLIC_" },
		);

		expect(result.API_URL).toBe("https://api.example.com");
		expect(result.PORT).toBe("3000");
	});

	it("should filter environment variables by prefix with number parsing", () => {
		const env = {
			BUN_PUBLIC_API_URL: "https://api.example.com",
			BUN_PUBLIC_PORT: "3000",
			PRIVATE_KEY: "secret", // Should be filtered out
		};

		const result = createEnv(
			{
				API_URL: "string",
				PORT: "number.port", // Using number.port type
			},
			{ env, prefix: "BUN_PUBLIC_" },
		);

		expect(result.API_URL).toBe("https://api.example.com");
		expect(result.PORT).toBe(3000);
	});

	it("should handle empty prefix gracefully", () => {
		const env = {
			TEST_STRING: "hello",
		};

		const { TEST_STRING } = createEnv(
			{
				TEST_STRING: "string",
			},
			{ env, prefix: "" },
		);

		expect(TEST_STRING).toBe("hello");
	});

	it("should ignore variables that don't match prefix", () => {
		const env = {
			BUN_PUBLIC_API_URL: "https://api.example.com",
			VITE_PORT: "3000", // Different prefix
			NO_PREFIX: "value", // No prefix
		};

		expect(() =>
			createEnv(
				{
					API_URL: "string",
					PORT: "string", // This should fail because only BUN_PUBLIC_API_URL exists, no PORT after filtering
				},
				{ env, prefix: "BUN_PUBLIC_" },
			),
		).toThrow("PORT");
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
});
