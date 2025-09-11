import chalk from "chalk";
import { describe, expect, it } from "vitest";
import { createEnv } from "./create-env";
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
		return `${chalk.red("Errors found while validating environment variables")}\n${indent(
			`${chalk.yellow(error.name)} must be ${error.requiredType} (was ${error.providedType})`,
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

	it("should validate boolean env variables", () => {
		process.env.TEST_BOOLEAN_TRUE = "true";
		process.env.TEST_BOOLEAN_FALSE = "false";
		process.env.TEST_BOOLEAN_ONE = "1";
		process.env.TEST_BOOLEAN_ZERO = "0";

		const env = createEnv({
			TEST_BOOLEAN_TRUE: "string.boolean",
			TEST_BOOLEAN_FALSE: "string.boolean",
			TEST_BOOLEAN_ONE: "string.boolean",
			TEST_BOOLEAN_ZERO: "string.boolean",
		});

		expect(env.TEST_BOOLEAN_TRUE).toBe(true);
		expect(env.TEST_BOOLEAN_FALSE).toBe(false);
		expect(env.TEST_BOOLEAN_ONE).toBe(true);
		expect(env.TEST_BOOLEAN_ZERO).toBe(false);
	});

	it("should validate boolean env variables with default values", () => {
		const env = createEnv({
			FEATURE_ENABLED: "string.boolean = 'false'",
			DEBUG_MODE: "string.boolean = 'true'",
		});

		expect(env.FEATURE_ENABLED).toBe(false);
		expect(env.DEBUG_MODE).toBe(true);
	});

	it("should throw when boolean env variable has invalid value", () => {
		process.env.INVALID_BOOLEAN = "maybe";

		expect(() =>
			createEnv({
				INVALID_BOOLEAN: "string.boolean",
			}),
		).toThrow(
			expectedError([
				{
					requiredType: "a boolean value (true, false, 1, 0, yes, no, on, off)",
					providedType: '"maybe"',
					name: "INVALID_BOOLEAN",
				},
			]),
		);
	});
});
