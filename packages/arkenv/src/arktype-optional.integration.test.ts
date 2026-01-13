import { afterEach, describe, expect, it, vi } from "vitest";

describe("ArkType Optional Contract", () => {
	afterEach(async () => {
		vi.clearAllMocks();

		const G = globalThis as any;

		// Reset loader via global Symbol
		const loader = G[Symbol.for("__ARKENV_ARKTYPE_LOADER__")];
		if (loader) {
			loader.reset();
		}

		// Reset scope cache via global Symbol
		const scopeCache = G[Symbol.for("__ARKENV_SCOPE_CACHE__")];
		if (scopeCache) {
			scopeCache.scope = undefined;
		}

		delete process.env.ARKENV_FORCE_MISSING;
	});

	describe("Scenario 1: ArkType Strings + ArkType Present", () => {
		it("should validate correctly using ArkType string DSL", async () => {
			const { createEnv } = await import("./index");
			const env = createEnv(
				{
					PORT: "number.port",
				},
				{
					env: { PORT: "3000" },
				},
			);
			expect(env.PORT).toBe(3000);
		});
	});

	describe("Scenario 2: Compiled ArkType Schema + ArkType Present", () => {
		it("should validate correctly using type()", async () => {
			const { createEnv, type } = await import("./index");
			const env = createEnv(
				{
					PORT: type("number.port"),
				},
				{
					env: { PORT: "8080" },
				},
			);
			expect(env.PORT).toBe(8080);
		});
	});

	describe("Scenario 3: Standard Schema (Zod) + ArkType Missing", () => {
		it("should support Zod mapping even if ArkType is unavailable", async () => {
			process.env.ARKENV_FORCE_MISSING = "true";

			const G = globalThis as any;
			const scopeCache = G[Symbol.for("__ARKENV_SCOPE_CACHE__")];
			if (scopeCache) scopeCache.scope = undefined;

			const { createEnv } = await import("./index");
			const { z } = await import("zod");

			const env = createEnv(
				{
					PORT: z.coerce.number(),
				},
				{
					env: { PORT: "5432" },
				},
			);

			expect(env.PORT).toBe(5432);
		});

		it("should not contain ArkType-specific terms in Zod validation errors", async () => {
			process.env.ARKENV_FORCE_MISSING = "true";

			const G = globalThis as any;
			const scopeCache = G[Symbol.for("__ARKENV_SCOPE_CACHE__")];
			if (scopeCache) scopeCache.scope = undefined;

			const { createEnv } = await import("./index");
			const { z } = await import("zod");

			try {
				createEnv(
					{
						PORT: z.number(),
					},
					{
						env: { PORT: "not-a-number" },
					},
				);
				expect.fail("Should have thrown");
			} catch (e: any) {
				expect(e.message).not.toContain("ArkType");
				expect(e.message).toMatch(/expected number/i);
			}
		});
	});

	describe("Scenario 4: ArkType Strings + ArkType Missing", () => {
		it("should provide a friendly, actionable error message", async () => {
			process.env.ARKENV_FORCE_MISSING = "true";

			const G = globalThis as any;
			const scopeCache = G[Symbol.for("__ARKENV_SCOPE_CACHE__")];
			if (scopeCache) scopeCache.scope = undefined;

			const { createEnv } = await import("./index");
			expect(() =>
				createEnv(
					{
						// Use unique definition to avoid any potential internal ArkType caching
						PORT: "number.port > 0",
					},
					{
						env: { PORT: "3000" },
					},
				),
			).toThrow(/ArkType is required/);
		});
	});
});
