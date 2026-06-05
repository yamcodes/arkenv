import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { createEnv } from "./standard.ts";

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
	it("should not coerce by default", () => {
		vi.stubEnv("NUMBER_VAR", "42");

		expect(() =>
			createEnv(
				{ NUMBER_VAR: createMockStandardJSONSchema(42, { type: "number" }) },
				{ coerce: false }, // Explicit default
			),
		).toThrow(/Expected number, received string/);

		vi.unstubAllEnvs();
	});

	it("should coerce numbers and booleans when coerce is true", () => {
		vi.stubEnv("NUMBER_VAR", "42");
		vi.stubEnv("BOOLEAN_VAR", "true");

		const env = createEnv(
			{
				NUMBER_VAR: createMockStandardJSONSchema(42, { type: "number" }),
				BOOLEAN_VAR: createMockStandardJSONSchema(true, { type: "boolean" }),
			},
			{ coerce: true },
		);

		expect(env.NUMBER_VAR).toBe(42);
		expect(env.BOOLEAN_VAR).toBe(true);

		vi.unstubAllEnvs();
	});

	it("should coerce dates when coerce is true", () => {
		vi.stubEnv("DATE_VAR", "2023-01-01T00:00:00.000Z");

		const env = createEnv(
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

		vi.unstubAllEnvs();
	});

	it("should provide smart hints when coerce is true but JSON schema is missing", () => {
		vi.stubEnv("NUMBER_VAR", "42");

		expect(() =>
			createEnv(
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
			)
		).toThrow(/Hint: 'coerce: true' enabled, but the validator for 'NUMBER_VAR' lacks Standard JSON Schema support/);

		vi.unstubAllEnvs();
	});
});
