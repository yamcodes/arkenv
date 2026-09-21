import { describe, expect, it } from "vitest";
import { REMOVED_NESTED_BAG_MESSAGE } from "./removed-nested";
import { parseSchemaShape } from "./schema-shape";

describe("schema-shape helper", () => {
	describe("parseSchemaShape", () => {
		it("parses flat schema with default NUXT_PUBLIC_ and NODE_ENV partitioning", () => {
			const schema = {
				DATABASE_URL: "string",
				NUXT_PUBLIC_API_URL: "string",
				NODE_ENV: "string",
			};

			const parsed = parseSchemaShape(schema, undefined, { isServer: true });
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

		it("rejects the removed nested bag API", () => {
			expect(() =>
				parseSchemaShape(
					{
						server: { DB: "string" },
						client: { NUXT_PUBLIC_CLIENT: "string" },
						shared: { SHARED: "string" },
						runtimeEnv: { DB: "val" },
					} as never,
					undefined,
				),
			).toThrow(REMOVED_NESTED_BAG_MESSAGE);
		});

		it("does not treat a flat env key named server as nested", () => {
			const parsed = parseSchemaShape(
				{ server: "string" },
				undefined,
				{ isServer: true },
			);
			expect(Object.keys(parsed.server)).toEqual(["server"]);
		});
	});
});
