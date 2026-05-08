import { describe, expect, expectTypeOf, it } from "vitest";
import { createEnv, type } from "./index";

describe("Type Regression (Issue #796)", () => {
	it("should infer the same type for inline and explicit schemas", () => {
		const envInline = createEnv({ PORT: "number" }, { env: { PORT: "3000" } });
		const envExplicit = createEnv(type({ PORT: "number" }), {
			env: { PORT: "3000" },
		});

		expectTypeOf(envInline).toEqualTypeOf(envExplicit);
		expectTypeOf(envInline.PORT).toEqualTypeOf<number>();
	});

	it("should narrow inline schema types correctly", () => {
		const env = createEnv(
			{
				STR: "string",
				NUM: "number",
				BOOL: "boolean",
			},
			{ env: { STR: "hi", NUM: "1", BOOL: "true" } },
		);

		expectTypeOf(env.STR).toEqualTypeOf<string>();
		expectTypeOf(env.NUM).toEqualTypeOf<number>();
		expectTypeOf(env.BOOL).toEqualTypeOf<boolean>();
	});

	it("should fail for invalid DSL strings", () => {
		// @ts-expect-error - "invalid" is not a valid ArkType DSL
		expect(() =>
			createEnv({ KEY: "invalid" }, { env: { KEY: "val" } }),
		).toThrow();
	});

	it("should infer custom keywords correctly", () => {
		const env = createEnv(
			{
				PORT: "number.port",
				HOST: "string.host",
			},
			{ env: { PORT: "8080", HOST: "localhost" } },
		);

		expectTypeOf(env.PORT).toEqualTypeOf<number>();
		expectTypeOf(env.HOST).toEqualTypeOf<string>();
	});

	it("should infer arrays correctly", () => {
		const env = createEnv(
			{
				TAGS: "string[]",
			},
			{ env: { TAGS: "a,b,c" } },
		);

		expectTypeOf(env.TAGS).toEqualTypeOf<string[]>();
	});

	it("should handle optional variables correctly", () => {
		const env = createEnv(
			{
				"OPTIONAL?": "string",
			},
			{ env: {} },
		);

		expectTypeOf(env.OPTIONAL).toEqualTypeOf<string | undefined>();
	});

	it("should handle default values correctly", () => {
		// In ArkType, default values are part of the DSL or handled via .default()
		// For inline schemas, we usually use the DSL: "string = 'default'"
		const env = createEnv(
			{
				WITH_DEFAULT: "string = 'default'",
			},
			{ env: {} },
		);

		expectTypeOf(env.WITH_DEFAULT).toEqualTypeOf<string>();
	});
});
