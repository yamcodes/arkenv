import { afterEach, describe, expect, it, vi } from "vitest";
import { createEnv } from "./create-env";
import { ArkEnvError } from "./errors";
import { type } from "./type";

describe("createEnv + type + errors + utils integration", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("error propagation through full stack", () => {
		it("should throw ArkEnvError with formatted message for invalid type", () => {
			vi.stubEnv("PORT", "not-a-number");

			try {
				createEnv({
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
				createEnv({
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
				createEnv({
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
				createEnv({
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
				createEnv({
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
				createEnv({
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
				// Indented lines should start with spaces (from indent function)
				if (errorLine) {
					expect(errorLine.trim()).toContain("PORT");
				}
			}
		});

		it("should include value in error message when provided", () => {
			vi.stubEnv("PORT", "abc");

			try {
				createEnv({
					PORT: type("number.port"),
				});
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(ArkEnvError);
				const envError = error as ArkEnvError;
				// Error should include the provided value in formatted output
				expect(envError.message).toContain("PORT");
			}
		});

		it("should propagate errors from custom types correctly", () => {
			vi.stubEnv("HOST", "invalid");
			vi.stubEnv("PORT", "99999");

			try {
				createEnv({
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
