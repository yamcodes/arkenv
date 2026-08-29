import { describe, expect, it } from "vitest";

import {
	extractClientKeys,
	extractKeys,
	extractServerKeys,
	extractSharedKeys,
} from "./config";

describe("Nuxt config parser", () => {
	it("should extract keys in nested layout", () => {
		const content = `
			export const env = arkenv({
				server: {
					DATABASE_URL: "string",
					ADMIN_KEY: "string"
				},
				client: {
					NUXT_PUBLIC_API_URL: "string"
				},
				shared: {
					NODE_ENV: "string"
				}
			});
		`;

		const res = extractKeys(content);
		expect(res.serverKeys).toEqual(["DATABASE_URL", "ADMIN_KEY"]);
		expect(res.clientKeys).toEqual(["NUXT_PUBLIC_API_URL"]);
		expect(res.sharedKeys).toEqual(["NODE_ENV"]);
	});

	it("should extract keys in flat layout", () => {
		const content = `
			export const env = arkenv({
				DATABASE_URL: "string",
				NUXT_PUBLIC_API_URL: "string",
				NODE_ENV: "string",
				CUSTOM_SHARED: "string",
			}, {
				exposeToClient: ["CUSTOM_SHARED"],
			});
		`;

		const res = extractKeys(content);
		expect(res.serverKeys).toEqual(["DATABASE_URL"]);
		expect(res.clientKeys).toEqual(["NUXT_PUBLIC_API_URL"]);
		expect(res.sharedKeys).toEqual(["NODE_ENV", "CUSTOM_SHARED"]);
	});

	it("should handle parser edge cases with comments, nested objects, and templates", () => {
		const content = `
			export const env = arkenv({
				server: {
					// A single line comment
					DATABASE_URL: "string", /* inline comment */
					/* 
					   Multi-line comment 
					*/
					ADMIN_KEY: "string",
					NESTED: {
						A: "string"
					}
				},
				client: {
					NUXT_PUBLIC_API_URL: "string = 'http://localhost'",
					// NUXT_PUBLIC_IGNORE: "string"
					NUXT_PUBLIC_TEMPLATE: \`string:\${1}\`
				},
				shared: {
					NODE_ENV: "string"
				}
			});
		`;

		const res = extractKeys(content);
		expect(res.serverKeys).toEqual(["DATABASE_URL", "ADMIN_KEY", "NESTED"]);
		expect(res.clientKeys).toEqual([
			"NUXT_PUBLIC_API_URL",
			"NUXT_PUBLIC_TEMPLATE",
		]);
		expect(res.sharedKeys).toEqual(["NODE_ENV"]);
	});

	it("should extract client, server, and shared keys from separate file contents", () => {
		const clientContent = `
			import arkenv from "./generated/env.gen";
			export const env = arkenv({
				NUXT_PUBLIC_API_URL: "string"
			});
		`;
		const serverContent = `
			import arkenv from "@arkenv/nuxt";
			export const env = arkenv({
				DATABASE_URL: "string"
			});
		`;
		const sharedContent = `
			import { type } from "@arkenv/core";
			export const SharedSchema = type({
				NODE_ENV: "string"
			});
		`;

		expect(extractClientKeys(clientContent)).toEqual(["NUXT_PUBLIC_API_URL"]);
		expect(extractServerKeys(serverContent)).toEqual(["DATABASE_URL"]);
		expect(extractSharedKeys(sharedContent)).toEqual(["NODE_ENV"]);
	});
});
