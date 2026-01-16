import { describe, expect, it, vi } from "vitest";
import { loadArkTypeValidator } from "./load-arktype.ts";
import { createRequire } from "node:module";

vi.mock("node:module", async (importOriginal) => {
	const original = await importOriginal<typeof import("node:module")>();
	return {
		...original,
		createRequire: vi.fn(),
	};
});

describe("load-arktype utility", () => {
	it("should load the validator if available", () => {
		const mockRequire = vi.fn().mockReturnValue({ parse: vi.fn() });
		vi.mocked(createRequire).mockReturnValue(mockRequire as any);

		const result = loadArkTypeValidator();
		expect(result).toBeDefined();
		expect(mockRequire).toHaveBeenCalled();
	});

	it("should throw a clear error if 'arktype' package is missing", () => {
		const mockRequire = vi.fn().mockImplementation((path: string) => {
			if (path.includes("arktype")) {
				const err = new Error("Cannot find module 'arktype'");
				(err as any).code = "MODULE_NOT_FOUND";
				throw err;
			}
			throw new Error("File not found");
		});
		vi.mocked(createRequire).mockReturnValue(mockRequire as any);

		expect(() => loadArkTypeValidator()).toThrow(
			/The 'arktype' package is required when using the default validator mode/,
		);
	});

	it("should propagate other errors (like syntax errors in the logic)", () => {
		const mockRequire = vi.fn().mockImplementation((path: string) => {
			if (path.includes("arktype")) {
				throw new Error("Syntax Error: unexpected token");
			}
			throw new Error("File not found");
		});
		vi.mocked(createRequire).mockReturnValue(mockRequire as any);

		expect(() => loadArkTypeValidator()).toThrow(
			"Syntax Error: unexpected token",
		);
	});
});
