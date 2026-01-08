import { afterEach, describe, expect, it, vi } from "vitest";
import { arkenv } from "./create-env";
import { ArkEnvError } from "./errors";
import { type } from "./type";

// Helper to strip ANSI color codes (ESC character code 27)
const stripAnsi = (str: string) =>
	str.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g"), "");

describe("arkenv + type + errors + utils integration", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("error propagation through full stack", () => {
		it("should throw ArkEnvError with formatted message for invalid type", () => {
			vi.stubEnv("PORT", "not-a-number");

			try {
				arkenv({
					PORT: type("number.port"),
				});
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(ArkEnvError);
				expect(error).toBeInstanceOf(Error);

				const envError = error as ArkEnvError;
				expect(envError.name).toBe("ArkEnvError");
				expect(envError.message).toContain("PORT");
				expect(envError.message).toContain(
					"Errors found while validating environment variables",
				);
			}
		});

		it("should throw ArkEnvError with formatted message for invalid host", () => {
			vi.stubEnv("HOST", "invalid-host");

			try {
				arkenv({
					HOST: type("string.host"),
				});
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(ArkEnvError);
				const envError = error as ArkEnvError;
				expect(envError.message).toContain("HOST");
				expect(envError.message).toContain(
					"Errors found while validating environment variables",
				);
			}
		});

		it("should throw ArkEnvError with formatted message for invalid boolean", () => {
			vi.stubEnv("DEBUG", "maybe");

			try {
				arkenv({
					DEBUG: type("boolean"),
				});
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(ArkEnvError);
				const envError = error as ArkEnvError;
				expect(envError.name).toBe("ArkEnvError");
				expect(envError.message).toContain("DEBUG");
				expect(envError.message).toContain(
					"Errors found while validating environment variables",
				);
			}
		});

		it("should throw ArkEnvError with formatted message for missing required variable", () => {
			try {
				arkenv({
					REQUIRED_VAR: "string",
				});
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(ArkEnvError);
				const envError = error as ArkEnvError;
				expect(envError.name).toBe("ArkEnvError");
				expect(envError.message).toContain("REQUIRED_VAR");
				expect(envError.message).toContain(
					"Errors found while validating environment variables",
				);
			}
		});

		it("should format multiple errors correctly", () => {
			vi.stubEnv("HOST", "invalid-host");
			vi.stubEnv("PORT", "99999");
			vi.stubEnv("DEBUG", "maybe");

			try {
				arkenv({
					HOST: type("string.host"),
					PORT: type("number.port"),
					DEBUG: type("boolean"),
				});
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(ArkEnvError);
				const envError = error as ArkEnvError;
				expect(envError.name).toBe("ArkEnvError");
				expect(envError.message).toContain("HOST");
				expect(envError.message).toContain("PORT");
				expect(envError.message).toContain("DEBUG");
				expect(envError.message).toContain(
					"Errors found while validating environment variables",
				);
			}
		});

		it("should format errors with indentation", () => {
			vi.stubEnv("PORT", "not-a-number");

			try {
				arkenv({
					PORT: type("number.port"),
				});
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(ArkEnvError);
				const envError = error as ArkEnvError;
				// Error message should contain indented formatting (indent function adds spaces)
				// The formatted error should be indented under the main error message
				const lines = envError.message.split("\n");
				const errorLine = lines.find((line) => line.includes("PORT"));
				expect(errorLine).toBeDefined();
				// Indented lines should start with spaces (from indent function, default is 2 spaces)
				if (errorLine) {
					// Strip ANSI codes for testing
					const strippedLine = stripAnsi(errorLine);
					// Check that the line contains PORT
					expect(strippedLine).toContain("PORT");
					// Check that the line starts with leading spaces (indentation)
					expect(strippedLine).toMatch(/^\s+PORT/);
					// Verify it has at least 2 spaces (default indent amount)
					expect(strippedLine.startsWith("  ")).toBe(true);
				}
			}
		});

		it("should include value in error message when provided", () => {
			const invalidValue = "99999";
			vi.stubEnv("PORT", invalidValue);

			try {
				arkenv({
					PORT: type("number.port"),
				});
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(ArkEnvError);
				const envError = error as ArkEnvError;
				// Error should include the provided value in formatted output
				expect(envError.message).toContain("PORT");
				// Verify the actual invalid value appears in the error message
				expect(envError.message).toContain(invalidValue);
			}
		});

		it("should propagate errors from custom types correctly", () => {
			vi.stubEnv("HOST", "invalid");
			vi.stubEnv("PORT", "99999");

			try {
				arkenv({
					HOST: type("string.host"),
					PORT: type("number.port"),
				});
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(ArkEnvError);
				const envError = error as ArkEnvError;
				// Both errors should be formatted and included
				expect(envError.message).toContain("HOST");
				expect(envError.message).toContain("PORT");
			}
		});
	});
});
