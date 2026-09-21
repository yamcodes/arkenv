import { describe, expect, it } from "vitest";
import {
	assertNotNestedBag,
	assertNotRemovedExposeAliasSource,
	hasNestedBagSource,
	hasRemovedExposeAlias,
	hasRemovedExposeAliasSource,
	isNestedBagCall,
	NESTED_BAG_MIGRATION_URL,
	nestedBagMigrationErrorMessage,
	removedExposeAliasErrorMessage,
} from "./nested-bag-migration-error";

describe("nestedBagMigrationErrorMessage", () => {
	it("points callers at the flat API and migration guide", () => {
		const message = nestedBagMigrationErrorMessage();
		expect(message).toContain(
			"nested arkenv({ server, client, shared, runtimeEnv })",
		);
		expect(message).toContain("exposeToClient");
		expect(message).toContain(NESTED_BAG_MIGRATION_URL);
	});
});

describe("isNestedBagCall", () => {
	it("detects a boolean second argument", () => {
		expect(isNestedBagCall({}, true)).toBe(true);
		expect(isNestedBagCall({}, false)).toBe(true);
	});

	it("detects nested bucket objects on the first argument", () => {
		expect(isNestedBagCall({ server: { A: "string" } })).toBe(true);
		expect(isNestedBagCall({ client: { NEXT_PUBLIC_B: "string" } })).toBe(true);
		expect(isNestedBagCall({ shared: { C: "string" } })).toBe(true);
		expect(isNestedBagCall({ runtimeEnv: {} })).toBe(true);
	});

	it("detects ArkType type() wrappers as nested buckets", () => {
		const typeLike = Object.assign(() => ({}), { infer: {} });
		expect(isNestedBagCall({ server: typeLike })).toBe(true);
	});

	it("does not treat flat env keys named server as nested", () => {
		expect(isNestedBagCall({ server: "string" })).toBe(false);
		expect(
			isNestedBagCall({
				server: {
					"~standard": { version: 1, vendor: "mock", validate: () => ({}) },
				},
			}),
		).toBe(false);
	});

	it("accepts flat schemas and options", () => {
		expect(
			isNestedBagCall({ PORT: "number", NEXT_PUBLIC_HOST: "string" }),
		).toBe(false);
		expect(
			isNestedBagCall({ PORT: "number" }, { exposeToClient: ["PORT"] }),
		).toBe(false);
		expect(isNestedBagCall(null)).toBe(false);
		expect(isNestedBagCall(undefined)).toBe(false);
	});
});

describe("hasRemovedExposeAlias", () => {
	it("detects expose and shared option aliases", () => {
		expect(hasRemovedExposeAlias({ expose: ["A"] })).toBe(true);
		expect(hasRemovedExposeAlias({ shared: ["A"] })).toBe(true);
		expect(hasRemovedExposeAlias({ exposeToClient: ["A"] })).toBe(false);
		expect(hasRemovedExposeAlias(undefined)).toBe(false);
	});
});

describe("assertNotNestedBag", () => {
	it("throws the migration error for nested bags", () => {
		expect(() =>
			assertNotNestedBag({
				server: { DATABASE_URL: "string" },
				runtimeEnv: {},
			}),
		).toThrow(nestedBagMigrationErrorMessage());
	});

	it("throws for removed expose / shared aliases", () => {
		expect(() =>
			assertNotNestedBag(
				{ DATABASE_URL: "string" },
				{ expose: ["DATABASE_URL"] },
			),
		).toThrow(removedExposeAliasErrorMessage());
	});

	it("does not throw for flat calls", () => {
		expect(() =>
			assertNotNestedBag(
				{ DATABASE_URL: "string" },
				{ exposeToClient: ["DATABASE_URL"] },
			),
		).not.toThrow();
	});
});

describe("hasNestedBagSource", () => {
	it("detects nested object bags and object-wrapper calls in source text", () => {
		expect(hasNestedBagSource('server: { DATABASE_URL: "string" }')).toBe(true);
		expect(
			hasNestedBagSource('client: type({ NEXT_PUBLIC_X: "string" })'),
		).toBe(true);
		expect(
			hasNestedBagSource('client: at.type({ NEXT_PUBLIC_X: "string" })'),
		).toBe(true);
		expect(
			hasNestedBagSource("server: z.object({ DATABASE_URL: z.string() })"),
		).toBe(true);
		expect(hasNestedBagSource('server: "string"')).toBe(false);
		expect(hasNestedBagSource("server: z.string()")).toBe(false);
	});
});

describe("hasRemovedExposeAliasSource", () => {
	it("detects expose / shared aliases without matching exposeToClient", () => {
		expect(hasRemovedExposeAliasSource('expose: ["A"]')).toBe(true);
		expect(hasRemovedExposeAliasSource('shared: ["A"]')).toBe(true);
		expect(hasRemovedExposeAliasSource('exposeToClient: ["A"]')).toBe(false);
	});
});

describe("assertNotRemovedExposeAliasSource", () => {
	it("throws for removed aliases in options source", () => {
		expect(() =>
			assertNotRemovedExposeAliasSource('expose: ["CUSTOM"]'),
		).toThrow(removedExposeAliasErrorMessage());
	});
});
