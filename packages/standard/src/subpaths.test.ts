import * as v from "valibot";
import { describe, expect, expectTypeOf, it } from "vitest";
import * as zMini from "zod/mini";
import { arkenv as valibotArkenv } from "./valibot";
import { arkenv as zodMiniArkenv } from "./zod-mini";

describe("@arkenv/standard subpaths", () => {
	it("coerces Valibot number and boolean fields without a toJsonSchema callback", () => {
		const env = valibotArkenv(
			{
				PORT: v.number(),
				DEBUG: v.boolean(),
			},
			{ env: { PORT: "3000", DEBUG: "true" } },
		);

		expectTypeOf(env.PORT).toBeNumber();
		expectTypeOf(env.DEBUG).toBeBoolean();
		expect(env.PORT).toBe(3000);
		expect(env.DEBUG).toBe(true);
	});

	it("coerces Zod Mini number and boolean fields without a toJsonSchema callback", () => {
		const env = zodMiniArkenv(
			{
				PORT: zMini.number(),
				DEBUG: zMini.boolean(),
			},
			{ env: { PORT: "3000", DEBUG: "true" } },
		);

		expectTypeOf(env.PORT).toBeNumber();
		expectTypeOf(env.DEBUG).toBeBoolean();
		expect(env.PORT).toBe(3000);
		expect(env.DEBUG).toBe(true);
	});

	it("lets Valibot callers override the bound toJsonSchema converter", () => {
		expect(() =>
			valibotArkenv(
				{ PORT: v.number() },
				{
					env: { PORT: "3000" },
					toJsonSchema: () => undefined,
				},
			),
		).toThrow(
			/Hint: coercion is enabled by default, but the validator for 'PORT' lacks Standard JSON Schema support/,
		);
	});

	it("lets Zod Mini callers override the bound toJsonSchema converter", () => {
		expect(() =>
			zodMiniArkenv(
				{ PORT: zMini.number() },
				{
					env: { PORT: "3000" },
					toJsonSchema: () => undefined,
				},
			),
		).toThrow(
			/Hint: coercion is enabled by default, but the validator for 'PORT' lacks Standard JSON Schema support/,
		);
	});
});
