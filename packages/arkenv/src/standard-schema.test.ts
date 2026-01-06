import { describe, expect, it } from "vitest";
import { z } from "zod";
import { arkenv } from "./index";

describe("Standard Schema integration", () => {
	it("should work with top-level zod schemas", () => {
		const schema = z.object({
			PORT: z.coerce.number(),
			HOST: z.string().default("localhost"),
		});

		const env = arkenv(schema, {
			env: { PORT: "3000" },
		});

		expect(env).toEqual({
			PORT: 3000,
			HOST: "localhost",
		});
	});

	it("should support mixed validators in arkenv() mapping", () => {
		const env = arkenv(
			{
				PORT: "number.port", // ArkType DSL
				HOST: z.string().min(1), // Zod
			},
			{
				env: { PORT: "3000", HOST: "localhost" },
			},
		);

		expect(env).toEqual({
			PORT: 3000,
			HOST: "localhost",
		});
	});

	it("should throw a clear error if arkenv() is passed a wrapped schema", () => {
		const schema = z.object({ PORT: z.number() });

		expect(() =>
			arkenv(schema as any, {
				env: { PORT: "not-a-number" },
			}),
		).toThrow(/expects a mapping of { KEY: validator }, not a wrapped schema/);
	});

	it("should verify arkenv accepts a Standard Schema when ArkType is present (via mapping)", () => {
		const env = arkenv(
			{
				ZOD_VAL: z.string().email(),
			},
			{
				env: { ZOD_VAL: "test@example.com" },
			},
		);
		expect(env.ZOD_VAL).toBe("test@example.com");
	});
});
