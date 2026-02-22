import { describe, expect, it } from "vitest";
import {
	ArkEnvError,
	formatInternalErrors,
	type ValidationIssue,
} from "./core";

describe("formatInternalErrors", () => {
	it("should format internal validation errors correctly", () => {
		const errors: ValidationIssue[] = [
			{ path: "PORT", message: "must be a number" },
			{ path: "API_KEY", message: "is required" },
		];

		const result = formatInternalErrors(errors);
		expect(result).toContain("PORT");
		expect(result).toContain("must be a number");
		expect(result).toContain("API_KEY");
		expect(result).toContain("is required");
	});
});

describe("ArkEnvError", () => {
	it("should create error with ValidationIssue[]", () => {
		const errors: ValidationIssue[] = [
			{ path: "PORT", message: 'must be a number (was "abc")' },
		];

		const error = new ArkEnvError(errors);
		expect(error.message).toContain(
			"Errors found while validating environment variables",
		);
		expect(error.message).toContain("PORT");
		expect(error.message).toContain('"abc"');
		expect(error.name).toBe("ArkEnvError");
	});

	it("should create error with internal validation errors", () => {
		const errors: ValidationIssue[] = [
			{ path: "PORT", message: "must be a number" },
		];

		const error = new ArkEnvError(errors);
		expect(error.message).toContain(
			"Errors found while validating environment variables",
		);
		expect(error.message).toContain("PORT");
		expect(error.message).toContain("must be a number");
	});

	it("should create error with custom message", () => {
		const errors: ValidationIssue[] = [
			{ path: "PORT", message: 'must be a number (was "abc")' },
		];

		const customMessage = "Custom validation error";
		const error = new ArkEnvError(errors, customMessage);
		expect(error.message).toContain(customMessage);
		expect(error.message).toContain("PORT");
		expect(error.message).toContain('"abc"');
	});
});
