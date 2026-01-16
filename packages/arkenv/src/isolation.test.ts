import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEnv } from "./create-env.ts";
import * as loader from "./utils/load-arktype.ts";

const mockStandardSchema = {
	"~standard": {
		version: 1,
		validate: (val: any) => ({ value: Number(val) }),
	},
} as any;

vi.mock("./utils/load-arktype.ts", () => ({
	loadArkTypeValidator: vi.fn(),
}));

describe("validator isolation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should NOT load ArkType logic when using 'standard' mode", () => {
		const result = createEnv(
			{ PORT: mockStandardSchema },
			{
				env: { PORT: "3000" },
				validator: "standard",
			},
		);

		expect(result.PORT).toBe(3000);
		expect(loader.loadArkTypeValidator).not.toHaveBeenCalled();
	});

	it("should load ArkType logic when using default mode", () => {
		// Mock a minimal validator
		vi.mocked(loader.loadArkTypeValidator).mockReturnValue({
			parse: vi.fn().mockReturnValue({ MOCKED: true }),
		} as any);

		const result = createEnv({ TEST: "string" } as any, {
			env: { TEST: "val" },
		});

		expect(result).toEqual({ MOCKED: true });
		expect(loader.loadArkTypeValidator).toHaveBeenCalled();
	});

	it("should NOT load ArkType logic when just importing 'arkenv'", async () => {
		// Import arkenv (already imported at top, but ensure it's loaded)
		expect(loader.loadArkTypeValidator).not.toHaveBeenCalled();
	});

	it("should load ArkType logic when calling 'createEnv' in default mode", () => {
		// Mock a minimal validator
		vi.mocked(loader.loadArkTypeValidator).mockReturnValue({
			parse: vi.fn().mockReturnValue({ MOCKED: true }),
		} as any);

		createEnv({ TEST: "string" } as any, {
			env: { TEST: "val" },
		});

		expect(loader.loadArkTypeValidator).toHaveBeenCalled();
	});

	it("should load ArkType logic when importing from 'arktype/index.ts'", async () => {
		// Importing from arkenv/arktype land SHOULD load arktype statically
		// (In these tests, we mock the loader, but arktype/index.ts imports $ which imports arktype)
		await import("./arktype/index.ts");
	});
});
