import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { createEnv } from "./create-env.ts";

// Mock Standard Schema validators for testing
const createMockStandardSchema = <TOutput>(outputValue: TOutput) => ({
	"~standard": {
		version: 1 as const,
		vendor: "mock",
		types: {} as { input: unknown; output: TOutput },
		validate: (value: unknown) => ({ value: outputValue }),
	},
});

describe("Standard Mode Type Inference", () => {
	it("should infer correct types from Standard Schema validators", () => {
		vi.stubEnv("STRING_VAR", "test");
		vi.stubEnv("NUMBER_VAR", "42");
		vi.stubEnv("BOOLEAN_VAR", "true");

		const env = createEnv(
			{
				STRING_VAR: createMockStandardSchema("test-string"),
				NUMBER_VAR: createMockStandardSchema(123),
				BOOLEAN_VAR: createMockStandardSchema(true),
			},
			{ validator: "standard" },
		);

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

		const env = createEnv(
			{
				TEST_VAR: createMockStandardSchema("output"),
			},
			{ validator: "standard" },
		);

		// Verify the type is a plain string, not wrapped in ArkType types
		expectTypeOf(env).toEqualTypeOf<{ TEST_VAR: string }>();

		vi.unstubAllEnvs();
	});

	it("should correctly infer object types from Standard Schema", () => {
		vi.stubEnv("OBJECT_VAR", "{}");

		type ExpectedOutput = { foo: string; bar: number };
		const env = createEnv(
			{
				OBJECT_VAR: createMockStandardSchema<ExpectedOutput>({
					foo: "test",
					bar: 42,
				}),
			},
			{ validator: "standard" },
		);

		expectTypeOf(env.OBJECT_VAR).toEqualTypeOf<ExpectedOutput>();
		expect(env.OBJECT_VAR).toEqual({ foo: "test", bar: 42 });

		vi.unstubAllEnvs();
	});

	it("should throw error when ArkType DSL strings are used in standard mode", () => {
		expect(() =>
			createEnv(
				{
					// @ts-expect-error - intentionally passing string in standard mode
					TEST_VAR: "string",
				},
				{ validator: "standard" },
			),
		).toThrow(/ArkType DSL strings are not supported in "standard" mode/);
	});

	it("should throw error when non-standard validators are used", () => {
		expect(() =>
			createEnv(
				{
					// @ts-expect-error - intentionally passing invalid validator
					TEST_VAR: { notAStandardSchema: true },
				},
				{ validator: "standard" },
			),
		).toThrow(/Invalid validator: expected a Standard Schema 1.0 validator/);
	});

	it("should maintain type safety with multiple validators", () => {
		vi.stubEnv("VAR1", "a");
		vi.stubEnv("VAR2", "b");
		vi.stubEnv("VAR3", "c");

		const env = createEnv(
			{
				VAR1: createMockStandardSchema("string-output"),
				VAR2: createMockStandardSchema(999),
				VAR3: createMockStandardSchema({ nested: "object" }),
			},
			{ validator: "standard" },
		);

		expectTypeOf(env).toEqualTypeOf<{
			VAR1: string;
			VAR2: number;
			VAR3: { nested: string };
		}>();

		vi.unstubAllEnvs();
	});
});
