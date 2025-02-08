import { describe, expect, it } from "bun:test";
import type { ArkErrors } from "arktype";
import { ArkEnvError, formatErrors } from "./errors";

/**
 * Define ArkErrorsForTest as a subset of ArkErrors
 */
type ArkErrorsForTest = {
	byPath: Record<string, Pick<ArkErrors["byPath"][string], "message">>;
};

/**
 * Format the errors returned by ArkType for testing purposes
 * @param errors - The errors returned by ArkType
 * @returns A string of the formatted errors
 */
const formatErrorsForTest = (errors: ArkErrorsForTest) => {
	return formatErrors(errors as ArkErrors);
};

/**
 * Create an ArkEnvError for testing purposes
 * @param errors - The errors returned by ArkType
 * @param message - The message to display in the error
 * @returns An instance of ArkEnvError
 */
const createArkEnvErrorForTest = (
	errors: ArkErrorsForTest,
	message?: string,
) => {
	return new ArkEnvError(errors as ArkErrors, message);
};

describe("formatErrors", () => {
	it("should format errors with values correctly", () => {
		const errors: ArkErrorsForTest = {
			byPath: {
				PORT: { message: 'PORT must be a number (was "abc")' },
				API_KEY: { message: 'API_KEY must be a string (was "123")' },
			},
		};

		const result = formatErrorsForTest(errors);
		expect(result).toContain("PORT");
		expect(result).toContain("must be a number");
		expect(result).toContain('"abc"');
		expect(result).toContain("API_KEY");
		expect(result).toContain("must be a string");
		expect(result).toContain('"123"');
	});

	it("should format errors without values correctly", () => {
		const errors: ArkErrorsForTest = {
			byPath: {
				DATABASE_URL: { message: "DATABASE_URL is required" },
			},
		};
		const result = formatErrorsForTest(errors);
		expect(result).toContain("DATABASE_URL");
		expect(result).toContain("is required");
	});

	it("should handle errors with path in message", () => {
		const errors: ArkErrorsForTest = {
			byPath: {
				ENV_VAR: { message: "ENV_VAR must be defined" },
			},
		};

		const result = formatErrorsForTest(errors);
		expect(result).toContain("ENV_VAR");
		expect(result).toContain("must be defined");
		expect(result.match(/ENV_VAR/g)?.length).toBe(1); // Should not duplicate the path
	});
});

describe("ArkEnvError", () => {
	it("should create error with default message", () => {
		const errors: ArkErrorsForTest = {
			byPath: {
				PORT: { message: 'PORT must be a number (was "abc")' },
			},
		};

		const error = createArkEnvErrorForTest(errors);
		expect(error.message).toContain(
			"Errors found while validating environment variables",
		);
		expect(error.message).toContain("PORT");
		expect(error.message).toContain('"abc"');
		expect(error.name).toBe("ArkEnvError");
	});

	it("should create error with custom message", () => {
		const errors: ArkErrorsForTest = {
			byPath: {
				PORT: { message: 'PORT must be a number (was "abc")' },
			},
		};

		const customMessage = "Custom validation error";
		const error = createArkEnvErrorForTest(errors, customMessage);
		expect(error.message).toContain(customMessage);
		expect(error.message).toContain("PORT");
		expect(error.message).toContain('"abc"');
	});
});
