import { describe, expect, expectTypeOf, it, vi } from "vitest";
// Import both the default export and the named export to verify they are identical and correctly exposed.
import defaultArkenv, { arkenv as namedArkenv } from ".";

describe("index.ts exports", () => {
	it("should export arkenv as default export", () => {
		expect(defaultArkenv).toBe(namedArkenv);
		expect(typeof defaultArkenv).toBe("function");
	});

	it("should have correct types for exported functions", () => {
		// Type assertion to verify exported function types
		expectTypeOf(defaultArkenv).toBeFunction();
		expectTypeOf(namedArkenv).toBeFunction();

		// Verify they have the same type signature
		expectTypeOf(defaultArkenv).toEqualTypeOf(namedArkenv);
	});

	it("should work with default import", () => {
		// Set test environment variable
		vi.stubEnv("TEST_DEFAULT_IMPORT", "test-value");

		const env = defaultArkenv({
			TEST_DEFAULT_IMPORT: "string",
		});

		expect(env.TEST_DEFAULT_IMPORT).toBe("test-value");
		expect(typeof env.TEST_DEFAULT_IMPORT).toBe("string");
	});

	it("should work with named import", () => {
		// Set test environment variable
		vi.stubEnv("TEST_NAMED_IMPORT", "test-value");

		const env = namedArkenv({
			TEST_NAMED_IMPORT: "string",
		});

		expect(env.TEST_NAMED_IMPORT).toBe("test-value");
		expect(typeof env.TEST_NAMED_IMPORT).toBe("string");
	});

	it("should throw error with default import when validation fails", () => {
		expect(() =>
			defaultArkenv({
				MISSING_DEFAULT_VAR: "string",
			}),
		).toThrow();
	});

	it("should throw error with named import when validation fails", () => {
		expect(() =>
			namedArkenv({
				MISSING_NAMED_VAR: "string",
			}),
		).toThrow();
	});

	it("should have same behavior for both default and named imports", () => {
		// Set test environment variable
		vi.stubEnv("COMPARISON_TEST", "same-value");

		const envFromDefault = defaultArkenv({
			COMPARISON_TEST: "string",
		});

		const envFromNamed = namedArkenv({
			COMPARISON_TEST: "string",
		});

		expect(envFromDefault.COMPARISON_TEST).toBe(envFromNamed.COMPARISON_TEST);
		expect(envFromDefault.COMPARISON_TEST).toBe("same-value");
		expect(typeof envFromDefault.COMPARISON_TEST).toBe("string");
		expect(typeof envFromNamed.COMPARISON_TEST).toBe("string");
	});
});
