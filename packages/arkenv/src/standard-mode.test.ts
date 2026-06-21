import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { ArkEnvError } from "./core";
import { arkenv, safeArkEnv } from "./standard";

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

		const env = arkenv({
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
	});

	it("should not have ArkType-specific types in standard mode", () => {
		vi.stubEnv("TEST_VAR", "value");

		const env = arkenv({
			TEST_VAR: createMockStandardSchema("output"),
		});

		// Verify the type is a plain string, not wrapped in ArkType types
		expectTypeOf(env.TEST_VAR).toBeString();
	});

	it("should correctly infer object types from Standard Schema", () => {
		vi.stubEnv("OBJECT_VAR", "{}");

		type ExpectedOutput = { foo: string; bar: number };
		const env = arkenv({
			OBJECT_VAR: createMockStandardSchema<ExpectedOutput>({
				foo: "test",
				bar: 42,
			}),
		});

		expectTypeOf(env.OBJECT_VAR).toEqualTypeOf<ExpectedOutput>();
		expect(env.OBJECT_VAR).toEqual({ foo: "test", bar: 42 });
	});

	it("should throw error when ArkType DSL strings are used in standard mode", () => {
		expect(() =>
			arkenv({
				TEST_VAR: "string",
			} as any),
		).toThrow(/ArkType DSL strings are not supported in "standard" mode/);
	});

	it("should throw error when non-standard validators are used", () => {
		expect(() =>
			arkenv({
				TEST_VAR: { notAStandardSchema: true },
			} as any),
		).toThrow(/Invalid validator: expected a Standard Schema 1.0 validator/);
	});

	it("should maintain typesafety with multiple validators", () => {
		vi.stubEnv("VAR1", "a");
		vi.stubEnv("VAR2", "b");
		vi.stubEnv("VAR3", "c");

		const env = arkenv({
			VAR1: createMockStandardSchema("string-output"),
			VAR2: createMockStandardSchema(999),
			VAR3: createMockStandardSchema({ nested: "object" }),
		});

		expectTypeOf(env.VAR1).toBeString();
		expectTypeOf(env.VAR2).toBeNumber();
		expectTypeOf(env.VAR3).toEqualTypeOf<{ nested: string }>();
	});
});

// Mock Standard JSON Schema validators for coercion testing
const createMockStandardJSONSchema = <TOutput>(
	outputValue: TOutput,
	jsonSchema: Record<string, any>,
) => ({
	"~standard": {
		version: 1 as const,
		vendor: "mock",
		types: {} as { input: unknown; output: TOutput },
		validate: (value: unknown) => {
			// Basic runtime type check for the tests
			const expectedType = typeof outputValue;
			if (
				expectedType !== "object" &&
				typeof value !== expectedType &&
				!(outputValue instanceof Date && value instanceof Date)
			) {
				return {
					issues: [
						{ message: `Expected ${expectedType}, received ${typeof value}` },
					],
				};
			}
			return { value: value as TOutput };
		},
		jsonSchema: {
			input: () => jsonSchema,
			output: () => jsonSchema,
		},
	},
});

describe("Standard Mode Coercion", () => {
	it("should coerce by default", () => {
		vi.stubEnv("NUMBER_VAR", "42");

		const env = arkenv({
			NUMBER_VAR: createMockStandardJSONSchema(42, { type: "number" }),
		});

		expect(env.NUMBER_VAR).toBe(42);
	});

	it("should not coerce when coerce is false", () => {
		vi.stubEnv("NUMBER_VAR", "42");

		expect(() =>
			arkenv(
				{ NUMBER_VAR: createMockStandardJSONSchema(42, { type: "number" }) },
				{ coerce: false },
			),
		).toThrow(/Expected number, received string/);
	});

	it("should coerce numbers and booleans when coerce is true", () => {
		vi.stubEnv("NUMBER_VAR", "42");
		vi.stubEnv("BOOLEAN_VAR", "true");

		const env = arkenv(
			{
				NUMBER_VAR: createMockStandardJSONSchema(42, { type: "number" }),
				BOOLEAN_VAR: createMockStandardJSONSchema(true, { type: "boolean" }),
			},
			{ coerce: true },
		);

		expect(env.NUMBER_VAR).toBe(42);
		expect(env.BOOLEAN_VAR).toBe(true);
	});

	it("should coerce dates when coerce is true", () => {
		vi.stubEnv("DATE_VAR", "2023-01-01T00:00:00.000Z");

		const env = arkenv(
			{
				DATE_VAR: createMockStandardJSONSchema(
					new Date("2023-01-01T00:00:00.000Z"),
					{ type: "string", format: "date-time" },
				),
			},
			{ coerce: true },
		);

		expect(env.DATE_VAR).toBeInstanceOf(Date);
		expect((env.DATE_VAR as Date).toISOString()).toBe(
			"2023-01-01T00:00:00.000Z",
		);
	});

	it("should provide smart hints when coerce is true but JSON schema is missing", () => {
		vi.stubEnv("NUMBER_VAR", "42");

		expect(() =>
			arkenv(
				{
					NUMBER_VAR: {
						"~standard": {
							version: 1,
							vendor: "mock",
							validate: () => ({
								issues: [{ message: "Expected number, received string" }],
							}),
						},
					},
				} as any,
				{ coerce: true },
			),
		).toThrow(
			/Hint: coercion is enabled by default, but the validator for 'NUMBER_VAR' lacks Standard JSON Schema support/,
		);
	});

	it("should provide smart hints by default when JSON schema is missing", () => {
		vi.stubEnv("NUMBER_VAR", "42");

		expect(() =>
			arkenv({
				NUMBER_VAR: {
					"~standard": {
						version: 1,
						vendor: "mock",
						validate: () => ({
							issues: [{ message: "Expected number, received string" }],
						}),
					},
				},
			} as any),
		).toThrow(
			/Hint: coercion is enabled by default, but the validator for 'NUMBER_VAR' lacks Standard JSON Schema support/,
		);
	});

	it("should not provide smart hints when coerce is false and JSON schema is missing", () => {
		vi.stubEnv("NUMBER_VAR", "42");

		const t = () =>
			arkenv(
				{
					NUMBER_VAR: {
						"~standard": {
							version: 1,
							vendor: "mock",
							validate: () => ({
								issues: [{ message: "Expected number, received string" }],
							}),
						},
					},
				} as any,
				{ coerce: false },
			);

		expect(t).toThrow("Expected number, received string");
		expect(t).not.toThrow(/Hint/);
	});

	it("should support fallback coercion triggers: toJSONSchema and toStandardJSONSchema.v1", () => {
		vi.stubEnv("ZOD_MINI_VAR", "42");
		vi.stubEnv("STNL_VAR", "true");

		const mockZodMiniValidator = {
			"~standard": {
				version: 1 as const,
				vendor: "zod-mini",
				types: {} as { input: unknown; output: number },
				validate: (val: unknown) => {
					if (typeof val !== "number") {
						return {
							issues: [{ message: `Expected number, received ${typeof val}` }],
						};
					}
					return { value: val };
				},
			},
			toJSONSchema: () => ({ type: "number" }),
		};

		const mockStnlValidator = {
			"~standard": {
				version: 1 as const,
				vendor: "stnl",
				types: {} as { input: unknown; output: boolean },
				validate: (val: unknown) => {
					if (typeof val !== "boolean") {
						return {
							issues: [{ message: `Expected boolean, received ${typeof val}` }],
						};
					}
					return { value: val };
				},
			},
			toStandardJSONSchema: {
				v1: () => ({ type: "boolean" }),
			},
		};

		const env = arkenv(
			{
				ZOD_MINI_VAR: mockZodMiniValidator as any,
				STNL_VAR: mockStnlValidator as any,
			},
			{ coerce: true },
		);

		expect(env.ZOD_MINI_VAR).toBe(42);
		expect(env.STNL_VAR).toBe(true);
	});
});

describe("Standard Mode emptyAsUndefined", () => {
	it("should treat empty strings as undefined when enabled", () => {
		vi.stubEnv("STRING_VAR", "");

		const env = arkenv(
			{
				STRING_VAR: createMockStandardSchema("default-value"),
			},
			{ emptyAsUndefined: true },
		);

		expect(env.STRING_VAR).toBe("default-value");
	});

	it("should pass empty strings through when disabled", () => {
		vi.stubEnv("STRING_VAR", "");

		const env = arkenv(
			{
				STRING_VAR: createMockStandardSchema(""),
			},
			{ emptyAsUndefined: false },
		);

		expect(env.STRING_VAR).toBe("");
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
			arkenv(
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
			arkenv(
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
			arkenv(
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
			arkenv(
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
			arkenv(
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

	it("should support safeArkEnv standard mode API", () => {
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

		const resultSuccess = safeArkEnv(
			{
				PORT: mockZodValidator,
			},
			{ env: { PORT: "3000" } },
		);
		expect(resultSuccess.success).toBe(true);
		if (resultSuccess.success) {
			expect(resultSuccess.data).toEqual({ PORT: "3000" });
		}

		const resultFail = safeArkEnv(
			{
				PORT: mockZodValidator,
			},
			{ env: {} },
		);
		expect(resultFail.success).toBe(false);
		if (!resultFail.success) {
			expect(resultFail.issues[0].code).toBe("MISSING_VARIABLE");
		}
	});
});
