import { describe, expect, it } from "vitest";
import createEnvDefault, { createEnv } from "./index";

describe("index.ts exports", () => {
	it("should export createEnv as default export", () => {
		expect(createEnvDefault).toBe(createEnv);
		expect(typeof createEnvDefault).toBe("function");
	});

	it("should work with default import", () => {
		process.env.TEST_DEFAULT_IMPORT = "test-value";

		const env = createEnvDefault({
			TEST_DEFAULT_IMPORT: "string",
		});

		expect(env.TEST_DEFAULT_IMPORT).toBe("test-value");
	});

	it("should work with named import", () => {
		process.env.TEST_NAMED_IMPORT = "test-value";

		const env = createEnv({
			TEST_NAMED_IMPORT: "string",
		});

		expect(env.TEST_NAMED_IMPORT).toBe("test-value");
	});

	it("should throw error with default import when validation fails", () => {
		expect(() =>
			createEnvDefault({
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
		process.env.COMPARISON_TEST = "same-value";

		const envFromDefault = createEnvDefault({
			COMPARISON_TEST: "string",
		});

		const envFromNamed = createEnv({
			COMPARISON_TEST: "string",
		});

		expect(envFromDefault.COMPARISON_TEST).toBe(envFromNamed.COMPARISON_TEST);
		expect(envFromDefault.COMPARISON_TEST).toBe("same-value");
	});
});
