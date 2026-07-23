import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the arkenv module with a spy that calls the real implementation by default
vi.mock("arkenv", async (importActual) => {
	const actual = await importActual<typeof import("arkenv")>();
	return {
		...actual,
		createEnv: vi.fn(actual.createEnv),
	};
});

import { arkenv } from "./plugin";

const { createEnv: mockCreateEnv } = vi.mocked(await import("arkenv"));

describe("Bun Plugin", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
		mockCreateEnv.mockClear();
	});

	afterEach(() => {
		process.env = originalEnv;
		mockCreateEnv.mockClear();
	});

	it("should create a plugin function", () => {
		expect(typeof arkenv).toBe("function");
	});

	it("should return a Bun plugin object", () => {
		// Set up a valid environment variable
		process.env.BUN_PUBLIC_TEST = "test-value";

		const pluginInstance = arkenv({ BUN_PUBLIC_TEST: "string" });

		expect(pluginInstance).toHaveProperty("name", "@arkenv/bun-plugin");
		expect(pluginInstance).toHaveProperty("setup");
		expect(typeof pluginInstance.setup).toBe("function");
	});

	it("should validate environment variables at plugin creation", () => {
		// Set up a valid environment variable
		process.env.BUN_PUBLIC_TEST = "test-value";

		expect(() => {
			arkenv({ BUN_PUBLIC_TEST: "string" });
		}).not.toThrow();
	});

	it("should throw if environment variable validation fails", () => {
		// Don't set the required environment variable
		delete process.env.BUN_PUBLIC_REQUIRED;

		expect(() => {
			arkenv({ BUN_PUBLIC_REQUIRED: "string" });
		}).toThrow();
	});

	it("should pass arkenvConfig to createEnv", () => {
		process.env.BUN_PUBLIC_TEST = "test-value";

		arkenv({ BUN_PUBLIC_TEST: "string" }, { coerce: false });

		expect(mockCreateEnv).toHaveBeenCalledWith(
			{ BUN_PUBLIC_TEST: "string" },
			expect.objectContaining({
				coerce: false,
				env: expect.any(Object),
			}),
		);
	});

	it("should throw a short missing-schema error without an env.ts starter", async () => {
		const { hybrid } = await import("./plugin");

		vi.stubGlobal("Bun", {
			file: () => ({
				exists: async () => false,
			}),
		});

		let onStart: (() => Promise<void>) | undefined;
		hybrid.setup({
			onStart: (callback: () => Promise<void>) => {
				onStart = callback;
			},
			onLoad: () => {},
		} as never);

		expect(onStart).toBeTypeOf("function");

		let message = "";
		try {
			await onStart?.();
		} catch (error) {
			message = error instanceof Error ? error.message : String(error);
		}

		expect(message).toMatch(/@arkenv\/bun-plugin: No environment schema found/);
		expect(message).toMatch(/Checked paths:/);
		expect(message).toMatch(/arkenv init/);
		expect(message).not.toMatch(/Example `src\/env\.ts`/);
		expect(message).not.toMatch(/```/);
		expect(message).not.toMatch(/import \{ type \} from "arktype"/);
	});
});
