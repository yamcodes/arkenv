import { describe, expect, it } from "vitest";
import { isLegacyNestedSchema, parseSchemaShape } from "./schema-shape";

describe("schema-shape helper", () => {
	describe("isLegacyNestedSchema", () => {
		it("detects boolean optionsOrIsServer as legacy", () => {
			expect(isLegacyNestedSchema({}, true)).toBe(true);
			expect(isLegacyNestedSchema({}, false)).toBe(true);
		});

		it("detects nested schema buckets as legacy", () => {
			expect(isLegacyNestedSchema({ server: { A: "string" } })).toBe(true);
			expect(
				isLegacyNestedSchema({ client: { NUXT_PUBLIC_B: "string" } }),
			).toBe(true);
			expect(isLegacyNestedSchema({ shared: { C: "string" } })).toBe(true);
			expect(isLegacyNestedSchema({ runtimeEnv: {} })).toBe(true);
		});

		it("detects flat schema as non-legacy", () => {
			expect(
				isLegacyNestedSchema({ PORT: "number", NUXT_PUBLIC_HOST: "string" }),
			).toBe(false);
			expect(
				isLegacyNestedSchema({ PORT: "number" }, { exposeToClient: ["PORT"] }),
			).toBe(false);
			expect(isLegacyNestedSchema(null)).toBe(false);
			expect(isLegacyNestedSchema(undefined)).toBe(false);
		});
	});

	describe("parseSchemaShape", () => {
		it("parses flat schema with default NUXT_PUBLIC_ and NODE_ENV partitioning", () => {
			const schema = {
				DATABASE_URL: "string",
				NUXT_PUBLIC_API_URL: "string",
				NODE_ENV: "string",
			};

			const parsed = parseSchemaShape(schema, undefined, { isServer: true });
			expect(parsed.isLegacy).toBe(false);
			expect(Object.keys(parsed.server)).toEqual(["DATABASE_URL"]);
			expect(Object.keys(parsed.client)).toEqual(["NUXT_PUBLIC_API_URL"]);
			expect(Object.keys(parsed.shared)).toEqual(["NODE_ENV"]);
			expect(parsed.declaredKeys).toEqual([
				"DATABASE_URL",
				"NUXT_PUBLIC_API_URL",
				"NODE_ENV",
			]);
			expect(parsed.publicKeys).toEqual(["NUXT_PUBLIC_API_URL", "NODE_ENV"]);
		});

		it("parses flat schema with exposeToClient option", () => {
			const schema = {
				API_KEY: "string",
				PUBLIC_NAME: "string",
			};

			const parsed = parseSchemaShape(
				schema,
				{ exposeToClient: ["PUBLIC_NAME"] },
				{ isServer: true },
			);

			expect(Object.keys(parsed.server)).toEqual(["API_KEY"]);
			expect(Object.keys(parsed.shared)).toEqual(["PUBLIC_NAME"]);
			expect(parsed.publicKeys).toEqual(["PUBLIC_NAME"]);
		});

		it("parses strict client layout as all public", () => {
			const schema = {
				NUXT_PUBLIC_SITE_NAME: "string",
			};

			const parsed = parseSchemaShape(schema, undefined, {
				isServer: false,
				strictLayout: "client",
			});

			expect(Object.keys(parsed.client)).toEqual(["NUXT_PUBLIC_SITE_NAME"]);
			expect(parsed.publicKeys).toEqual(["NUXT_PUBLIC_SITE_NAME"]);
		});

		it("parses strict server layout with no public keys", () => {
			const schema = {
				SECRET_KEY: "string",
			};

			const parsed = parseSchemaShape(schema, undefined, {
				isServer: true,
				strictLayout: "server",
			});

			expect(Object.keys(parsed.server)).toEqual(["SECRET_KEY"]);
			expect(parsed.publicKeys).toEqual([]);
		});

		it("parses isShared context as all shared/public", () => {
			const schema = {
				SHARED_VAR: "string",
			};

			const parsed = parseSchemaShape(schema, undefined, {
				isServer: true,
				isShared: true,
			});

			expect(Object.keys(parsed.shared)).toEqual(["SHARED_VAR"]);
			expect(parsed.publicKeys).toEqual(["SHARED_VAR"]);
		});

		it("parses legacy nested structure correctly", () => {
			const legacy = {
				server: { DB: "string" },
				client: { NUXT_PUBLIC_CLIENT: "string" },
				shared: { SHARED: "string" },
				runtimeEnv: { DB: "val" },
			};

			const parsed = parseSchemaShape(legacy, true);
			expect(parsed.isLegacy).toBe(true);
			expect(Object.keys(parsed.server)).toEqual(["DB"]);
			expect(Object.keys(parsed.client)).toEqual(["NUXT_PUBLIC_CLIENT"]);
			expect(Object.keys(parsed.shared)).toEqual(["SHARED"]);
			expect(parsed.declaredKeys).toEqual([
				"DB",
				"NUXT_PUBLIC_CLIENT",
				"SHARED",
			]);
			expect(parsed.publicKeys).toEqual(["NUXT_PUBLIC_CLIENT", "SHARED"]);
			expect(parsed.runtimeEnv).toEqual({ DB: "val" });
		});
	});
});
