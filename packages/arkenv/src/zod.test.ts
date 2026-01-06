import { describe, expect, it } from "vitest";
import { z } from "zod";
import arkenv from "./index";

describe("zod integration", () => {
	it("should work with zod schemas", () => {
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

	it("should throw ArkEnvError on validation failure", () => {
		const schema = z.object({
			PORT: z.number(),
		});

		expect(() =>
			arkenv(schema, {
				env: { PORT: "not-a-number" },
			}),
		).toThrow("PORT");
	});
});
