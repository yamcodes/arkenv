import { describe, expect, expectTypeOf, it } from "vitest";
import { isEnabled } from "./dce";

describe("isEnabled Dead-Code Elimination (DCE) helper", () => {
	type AppEnv = {
		NEXT_PUBLIC_ENABLE_BETA: boolean;
		NEXT_PUBLIC_API_URL: string;
		DATABASE_URL: string;
	};

	it("evaluates true when environment string is 'true' or '1'", () => {
		expect(isEnabled<AppEnv>("NEXT_PUBLIC_ENABLE_BETA", "true")).toBe(true);
		expect(isEnabled<AppEnv>("NEXT_PUBLIC_ENABLE_BETA", "1")).toBe(true);
		expect(isEnabled<AppEnv>("NEXT_PUBLIC_ENABLE_BETA", true)).toBe(true);
	});

	it("evaluates false when environment string is 'false', '0', undefined, or anything else", () => {
		expect(isEnabled<AppEnv>("NEXT_PUBLIC_ENABLE_BETA", "false")).toBe(false);
		expect(isEnabled<AppEnv>("NEXT_PUBLIC_ENABLE_BETA", "0")).toBe(false);
		expect(isEnabled<AppEnv>("NEXT_PUBLIC_ENABLE_BETA", undefined)).toBe(false);
		expect(isEnabled<AppEnv>("NEXT_PUBLIC_ENABLE_BETA", null)).toBe(false);
		expect(isEnabled<AppEnv>("NEXT_PUBLIC_ENABLE_BETA", "")).toBe(false);
		expect(isEnabled<AppEnv>("NEXT_PUBLIC_ENABLE_BETA", false)).toBe(false);
		expect(isEnabled<AppEnv>("NEXT_PUBLIC_ENABLE_BETA", "random-string")).toBe(
			false,
		);
	});

	it("enforces key type safety against the schema type", () => {
		// Valid keys from AppEnv
		isEnabled<AppEnv>("NEXT_PUBLIC_ENABLE_BETA", "true");
		isEnabled<AppEnv>("NEXT_PUBLIC_API_URL", "true");
		isEnabled<AppEnv>("DATABASE_URL", "true");

		// Return type is boolean
		expectTypeOf(
			isEnabled<AppEnv>("NEXT_PUBLIC_ENABLE_BETA", "true"),
		).toEqualTypeOf<boolean>();
	});
});
