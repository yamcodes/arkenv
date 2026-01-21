import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";
import { loadArkTypeValidator } from "./load-arktype.ts";

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

	it("should fall back to global require if createRequire throws", () => {
		vi.mocked(createRequire).mockImplementation(() => {
			throw new Error("createRequire failed");
		});

		// In Vitest/Node, global.require should be available.
		// If it falls back correctly, it will try to use the real require,
		// which will likely fail with MODULE_NOT_FOUND for our relative paths
		// in the test environment, but shouldn't throw the "createRequire failed" error.
		try {
			loadArkTypeValidator();
		} catch (e: any) {
			expect(e.message).not.toBe("createRequire failed");
		}
	});
});
