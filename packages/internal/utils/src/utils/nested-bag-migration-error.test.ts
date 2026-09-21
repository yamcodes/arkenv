import { describe, expect, it } from "vitest";
import {
	assertNotNestedBag,
	isNestedBagCall,
	NESTED_BAG_MIGRATION_URL,
	nestedBagMigrationErrorMessage,
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

	it("detects nested bucket keys on the first argument", () => {
		expect(isNestedBagCall({ server: { A: "string" } })).toBe(true);
		expect(isNestedBagCall({ client: { NEXT_PUBLIC_B: "string" } })).toBe(true);
		expect(isNestedBagCall({ shared: { C: "string" } })).toBe(true);
		expect(isNestedBagCall({ runtimeEnv: {} })).toBe(true);
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

describe("assertNotNestedBag", () => {
	it("throws the migration error for nested bags", () => {
		expect(() =>
			assertNotNestedBag({
				server: { DATABASE_URL: "string" },
				runtimeEnv: {},
			}),
		).toThrow(nestedBagMigrationErrorMessage());
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
