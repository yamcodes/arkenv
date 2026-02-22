import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { createEnv } from "./standard.ts";

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

	it("should maintain type safety with multiple validators", () => {
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
