import { describe, expect, it } from "vitest";
import { z } from "zod";
import { arkenv } from "./index";

describe("Standard Schema integration", () => {
	it("should throw if a top-level zod schema is passed directly", () => {
		const schema = z.object({
			PORT: z.coerce.number(),
			HOST: z.string().default("localhost"),
		});

		expect(() =>
			arkenv(schema as any, {
				env: { PORT: "3000" },
			}),
		).toThrow(/arkenv\(\) expects a mapping/);
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
