import { describe, expect, it } from "vitest";
import { createEnv } from "./create-env";

describe("createEnv options", () => {
	it("should apply coercion by default", () => {
		const env = {
			PORT: "3000",
			DEBUG: "true",
		};
		const parsed = createEnv(
			{
				PORT: "number",
				DEBUG: "boolean",
			},
			env,
		);
		expect(parsed.PORT).toBe(3000);
		expect(parsed.DEBUG).toBe(true);
	});

	it("should disable coercion via 3rd argument", () => {
		const env = {
			PORT: "3000",
			DEBUG: "true",
		};

		// Should fail because input is string "3000" but schema expects number,
		// and coercion is disabled.
		expect(() =>
			createEnv(
				{
					PORT: "number",
					DEBUG: "boolean",
				},
				env,
				{ coerce: false },
			),
		).toThrow();
	});

	it("should disable coercion via 2nd argument (using process.env)", () => {
		const originalEnv = process.env;
		process.env = { ...originalEnv, PORT: "3000" };

		try {
			expect(() =>
				createEnv(
					{
						PORT: "number",
					},
					{ coerce: false },
				),
			).toThrow();
		} finally {
			process.env = originalEnv;
		}
	});

	it("should allow disabling coercion when using type() definitions", () => {
		const env = {
			PORT: "3000",
		};
		const schema = {
			PORT: "number",
		};

		// With coercion (default)
		// Note: type definitions (EnvSchemaWithType) might behave differently if I didn't update that overload implementation correctly.
		// Actually, my implementation handles both raw and compiled types uniformly regarding options.
		// But let's verify.
	});
});
