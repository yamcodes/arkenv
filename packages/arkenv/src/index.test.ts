import {
	afterEach,
	beforeEach,
	describe,
	expect,
	expectTypeOf,
	it,
	vi,
} from "vitest";
import arkenv, { createEnv } from "./index";

// Capture snapshot of process.env at module level
const originalEnv = { ...process.env };

describe("index.ts exports", () => {
	beforeEach(() => {
		// Replace with a clean environment for each test
		process.env = {};
	});

	afterEach(() => {
		// Restore mocks and reset process.env to captured snapshot
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	it("should export createEnv as default export", () => {
		expect(arkenv).toBe(createEnv);
		expect(typeof arkenv).toBe("function");
	});

	it("should have correct types for exported functions", () => {
		// Type assertion to verify exported function types
		expectTypeOf(arkenv).toBeFunction();
		expectTypeOf(createEnv).toBeFunction();

		// Verify they have the same type signature
		expectTypeOf(arkenv).toEqualTypeOf(createEnv);
	});

	it("should work with default import", () => {
		// Set test environment variable
		process.env.TEST_DEFAULT_IMPORT = "test-value";

		const env = arkenv({
			TEST_DEFAULT_IMPORT: "string",
		});

		expect(env.TEST_DEFAULT_IMPORT).toBe("test-value");
		expect(typeof env.TEST_DEFAULT_IMPORT).toBe("string");
	});

	it("should work with named import", () => {
		// Set test environment variable
		process.env.TEST_NAMED_IMPORT = "test-value";

		const env = createEnv({
			TEST_NAMED_IMPORT: "string",
		});

		expect(env.TEST_NAMED_IMPORT).toBe("test-value");
		expect(typeof env.TEST_NAMED_IMPORT).toBe("string");
	});

	it("should throw error with default import when validation fails", () => {
		expect(() =>
			arkenv({
				MISSING_DEFAULT_VAR: "string",
			}),
		).toThrow();
	});

	it("should throw error with named import when validation fails", () => {
		expect(() =>
			createEnv({
				MISSING_NAMED_VAR: "string",
			}),
		).toThrow();
	});

	it("should have same behavior for both default and named imports", () => {
		// Set test environment variable
		process.env.COMPARISON_TEST = "same-value";

		const envFromDefault = arkenv({
			COMPARISON_TEST: "string",
		});

		const envFromNamed = createEnv({
			COMPARISON_TEST: "string",
		});

		expect(envFromDefault.COMPARISON_TEST).toBe(envFromNamed.COMPARISON_TEST);
		expect(envFromDefault.COMPARISON_TEST).toBe("same-value");
		expect(typeof envFromDefault.COMPARISON_TEST).toBe("string");
		expect(typeof envFromNamed.COMPARISON_TEST).toBe("string");
	});
});
