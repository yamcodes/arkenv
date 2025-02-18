import { describe, expect, it } from "bun:test";
import pc from "picocolors";
import * as ark from "./env";
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
		return `${pc.red("Errors found while validating environment variables")}\n${indent(
			`${pc.yellow(error.name)} must be ${error.requiredType} (was ${error.providedType})`,
		)}\n`;
	});

	return formattedErrors.join("\n");
};

describe("env", () => {
	it("should validate string env variables", () => {
		process.env.TEST_STRING = "hello";

		const env = ark.env({
			TEST_STRING: "string",
		});

		expect(env.TEST_STRING).toBe("hello");
	});

	it("should throw when required env variable is missing", () => {
		expect(() =>
			ark.env({
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
			ark.env({
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

		const { TEST_STRING } = ark.env(
			{
				TEST_STRING: "string",
			},
			env,
		);

		expect(TEST_STRING).toBe("hello");
	});
});
