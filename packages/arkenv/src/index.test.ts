import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import arkenv, { ArkEnvError, arkenv as arkenvNamed } from "./index";

describe("index.ts exports", () => {
	afterEach(() => {
		// Restore mocks and unstub all environment variables
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it("should export arkenv as default export", () => {
		expect(arkenv).toBe(arkenvNamed);
		expect(typeof arkenv).toBe("function");
	});

	it("should have correct types for exported functions", () => {
		// Type assertion to verify exported function types
		expectTypeOf(arkenv).toBeFunction();
		expectTypeOf(arkenvNamed).toBeFunction();

		// Verify they have the same type signature
		expectTypeOf(arkenv).toEqualTypeOf(arkenvNamed);
	});

	it("should work with default import", () => {
		// Set test environment variable
		vi.stubEnv("TEST_DEFAULT_IMPORT", "test-value");

		const env = arkenv({
			TEST_DEFAULT_IMPORT: "string",
		});

		expect(env.TEST_DEFAULT_IMPORT).toBe("test-value");
		expect(typeof env.TEST_DEFAULT_IMPORT).toBe("string");
	});

	it("should work with named import", () => {
		// Set test environment variable
		vi.stubEnv("TEST_NAMED_IMPORT", "test-value");

		const env = arkenvNamed({
			TEST_NAMED_IMPORT: "string",
		});

		expect(env.TEST_NAMED_IMPORT).toBe("test-value");
		expect(typeof env.TEST_NAMED_IMPORT).toBe("string");
	});

	it("should throw ArkEnvError with default import when validation fails", () => {
		expect(() =>
			arkenv({
				MISSING_DEFAULT_VAR: "string",
			}),
		).toThrow(ArkEnvError);

		expect(() =>
			arkenv({
				MISSING_DEFAULT_VAR: "string",
			}),
		).toThrow(/MISSING_DEFAULT_VAR.*string/);
	});

	it("should throw ArkEnvError with named import when validation fails", () => {
		expect(() =>
			arkenvNamed({
				MISSING_NAMED_VAR: "string",
			}),
		).toThrow(ArkEnvError);

		expect(() =>
			arkenvNamed({
				MISSING_NAMED_VAR: "string",
			}),
		).toThrow(/MISSING_NAMED_VAR.*string/);
	});

	it("should have same behavior for both default and named imports", () => {
		// Set test environment variable
		vi.stubEnv("COMPARISON_TEST", "same-value");

		const envFromDefault = arkenv({
			COMPARISON_TEST: "string",
		});

		const envFromNamed = arkenvNamed({
			COMPARISON_TEST: "string",
		});

		expect(envFromDefault.COMPARISON_TEST).toBe(envFromNamed.COMPARISON_TEST);
		expect(envFromDefault.COMPARISON_TEST).toBe("same-value");
		expect(typeof envFromDefault.COMPARISON_TEST).toBe("string");
		expect(typeof envFromNamed.COMPARISON_TEST).toBe("string");
	});
});
