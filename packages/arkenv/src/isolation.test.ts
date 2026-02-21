import { describe, expect, it } from "vitest";
import { createEnv } from "./standard.ts";

const mockStandardSchema = {
	"~standard": {
		version: 1,
		validate: (val: any) => ({ value: Number(val) }),
	},
} as any;

describe("validator isolation (standard entry)", () => {
	it("parses standard schemas without ArkType", () => {
		const result = createEnv(
			{ PORT: mockStandardSchema },
			{ env: { PORT: "3000" } },
		);

		expect(result.PORT).toBe(3000);
	});

	it("throws on ArkType DSL strings", () => {
		expect(() =>
			createEnv({ PORT: "number.port" } as any, { env: { PORT: "3000" } }),
		).toThrow('ArkType DSL strings are not supported in "standard" mode');
	});

	it("throws on validators without ~standard property", () => {
		expect(() =>
			createEnv({ PORT: { someArktypeThing: true } } as any, {
				env: { PORT: "3000" },
			}),
		).toThrow('"~standard" property');
	});

	it("loads ArkType statically when importing from arktype/index.ts", async () => {
		// Importing from arktype/index.ts SHOULD load arktype statically
		// (arktype/index.ts imports $ which imports arktype)
		await import("./arktype/index.ts");
	});
});
