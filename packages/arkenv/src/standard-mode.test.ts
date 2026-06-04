import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { createEnv, safeCreateEnv } from "./standard.ts";

// Mock Standard Schema validators for testing
const createMockStandardSchema = <TOutput>(outputValue: TOutput) => ({
	"~standard": {
		version: 1 as const,
		vendor: "mock",
		types: {} as { input: unknown; output: TOutput },
		validate: (_value: unknown) => ({ value: outputValue }),
	},
});

describe("Standard Mode Type Inference", () => {
	it("should infer correct types from Standard Schema validators", () => {
		vi.stubEnv("STRING_VAR", "test");
		vi.stubEnv("NUMBER_VAR", "42");
		vi.stubEnv("BOOLEAN_VAR", "true");

		const env = createEnv({
			STRING_VAR: createMockStandardSchema("test-string"),
			NUMBER_VAR: createMockStandardSchema(123),
			BOOLEAN_VAR: createMockStandardSchema(true),
		});

		// Type-level assertions
		expectTypeOf(env.STRING_VAR).toBeString();
		expectTypeOf(env.NUMBER_VAR).toBeNumber();
		expectTypeOf(env.BOOLEAN_VAR).toBeBoolean();

		// Runtime assertions
		expect(env.STRING_VAR).toBe("test-string");
		expect(env.NUMBER_VAR).toBe(123);
		expect(env.BOOLEAN_VAR).toBe(true);

		vi.unstubAllEnvs();
	});

	it("should not have ArkType-specific types in standard mode", () => {
		vi.stubEnv("TEST_VAR", "value");

		const env = createEnv({
			TEST_VAR: createMockStandardSchema("output"),
		});

		// Verify the type is a plain string, not wrapped in ArkType types
		expectTypeOf(env.TEST_VAR).toBeString();

		vi.unstubAllEnvs();
	});

	it("should correctly infer object types from Standard Schema", () => {
		vi.stubEnv("OBJECT_VAR", "{}");

		type ExpectedOutput = { foo: string; bar: number };
		const env = createEnv({
			OBJECT_VAR: createMockStandardSchema<ExpectedOutput>({
				foo: "test",
				bar: 42,
			}),
		});

		expectTypeOf(env.OBJECT_VAR).toEqualTypeOf<ExpectedOutput>();
		expect(env.OBJECT_VAR).toEqual({ foo: "test", bar: 42 });

		vi.unstubAllEnvs();
	});

	it("should throw error when ArkType DSL strings are used in standard mode", () => {
		expect(() =>
			createEnv({
				TEST_VAR: "string",
			} as any),
		).toThrow(/ArkType DSL strings are not supported in "standard" mode/);
	});

	it("should throw error when non-standard validators are used", () => {
		expect(() =>
			createEnv({
				TEST_VAR: { notAStandardSchema: true },
			} as any),
		).toThrow(/Invalid validator: expected a Standard Schema 1.0 validator/);
	});

	it("should maintain typesafety with multiple validators", () => {
		vi.stubEnv("VAR1", "a");
		vi.stubEnv("VAR2", "b");
		vi.stubEnv("VAR3", "c");

		const env = createEnv({
			VAR1: createMockStandardSchema("string-output"),
			VAR2: createMockStandardSchema(999),
			VAR3: createMockStandardSchema({ nested: "object" }),
		});

		expectTypeOf(env.VAR1).toBeString();
		expectTypeOf(env.VAR2).toBeNumber();
		expectTypeOf(env.VAR3).toEqualTypeOf<{ nested: string }>();

		vi.unstubAllEnvs();
	});

	it("should parse and normalize Standard Schema errors correctly", () => {
		const mockZodValidator = {
			"~standard": {
				version: 1 as const,
				vendor: "zod" as const,
				types: {} as any,
				validate: (value: unknown) => {
					if (value === undefined) {
						return {
							issues: [
								{
									message: "Required",
									code: "invalid_type",
									path: [],
									expected: "string",
									received: "undefined",
								} as any,
							],
						};
					}
					if (value === "invalid") {
						return {
							issues: [
								{
									message: "Invalid email",
									code: "invalid_string",
									validation: "email",
									path: [],
									expected: "string",
									received: "string",
								} as any,
							],
						};
					}
					return { value };
				},
			},
		};

		// 1. Test missing variable
		try {
			createEnv(
				{
					SOME_VAR: mockZodValidator,
				},
				{ env: {} },
			);
			expect.fail("Should throw");
		} catch (error: any) {
			expect(error.name).toBe("ArkEnvError");
			expect(error.issues).toBeDefined();
			expect(error.issues[0].code).toBe("MISSING_VARIABLE");
			expect(error.issues[0].message).toContain("must be string (was missing)");
			expect(error.issues[0].meta?.engine).toBe("zod");
		}

		// 2. Test invalid format
		try {
			createEnv(
				{
					SOME_VAR: mockZodValidator,
				},
				{ env: { SOME_VAR: "invalid" } },
			);
			expect.fail("Should throw");
		} catch (error: any) {
			expect(error.name).toBe("ArkEnvError");
			expect(error.issues).toBeDefined();
			expect(error.issues[0].code).toBe("INVALID_FORMAT");
			expect(error.issues[0].message).toContain("must be string");
			expect(error.issues[0].message).toContain("invalid");
		}
	});

	it("should redact sensitive fields in standard mode by default", () => {
		const mockZodValidator = {
			"~standard": {
				version: 1 as const,
				vendor: "zod" as const,
				types: {} as any,
				validate: (_value: unknown) => ({
					issues: [
						{
							message: "Invalid key",
							code: "custom",
							path: [],
							expected: "string",
							received: "string",
						} as any,
					],
				}),
			},
		};

		try {
			createEnv(
				{
					DB_PASSWORD: mockZodValidator,
				},
				{ env: { DB_PASSWORD: "my-secret-password" } },
			);
			expect.fail("Should throw");
		} catch (error: any) {
			expect(error.issues[0].message).toContain("[REDACTED]");
			expect(error.issues[0].message).not.toContain("my-secret-password");
		}

		// Programmatic debugSecrets override
		try {
			createEnv(
				{
					DB_PASSWORD: mockZodValidator,
				},
				{
					env: { DB_PASSWORD: "my-secret-password" },
					debugSecrets: true,
				},
			);
			expect.fail("Should throw");
		} catch (error: any) {
			expect(error.issues[0].message).toContain("my-secret-password");
		}
	});

	it("should safely handle traversal and JSON parsing issues", () => {
		const mockNestedValidator = {
			"~standard": {
				version: 1 as const,
				vendor: "zod" as const,
				types: {} as any,
				validate: (_value: unknown) => ({
					issues: [
						{
							message: "Invalid nested property",
							code: "invalid_type",
							path: ["port"],
						} as any,
					],
				}),
			},
		};

		// Malformed JSON should not crash, raw string should remain in received, and traversalError populated
		try {
			createEnv(
				{
					CONFIG: mockNestedValidator,
				},
				{ env: { CONFIG: "{ malformed json" } },
			);
			expect.fail("Should throw");
		} catch (error: any) {
			expect(error.issues[0].received).toBe("{ malformed json");
			expect(error.issues[0].meta?.traversalError).toContain(
				"Unparseable JSON",
			);
		}
	});

	it("should support safeCreateEnv standard mode API", () => {
		const mockZodValidator = {
			"~standard": {
				version: 1 as const,
				vendor: "zod" as const,
				types: {} as any,
				validate: (value: unknown) => {
					if (value === undefined) {
						return {
							issues: [
								{
									message: "Required",
									code: "invalid_type",
									path: [],
								} as any,
							],
						};
					}
					return { value };
				},
			},
		};

		const resultSuccess = safeCreateEnv(
			{
				PORT: mockZodValidator,
			},
			{ env: { PORT: "3000" } },
		);
		expect(resultSuccess.success).toBe(true);
		if (resultSuccess.success) {
			expect(resultSuccess.data).toEqual({ PORT: "3000" });
		}

		const resultFail = safeCreateEnv(
			{
				PORT: mockZodValidator,
			},
			{ env: {} },
		);
		expect(resultFail.success).toBe(false);
		if (!resultFail.success) {
			expect(resultFail.error).toContain("PORT");
			expect(resultFail.issues[0].code).toBe("MISSING_VARIABLE");
		}
	});
});
