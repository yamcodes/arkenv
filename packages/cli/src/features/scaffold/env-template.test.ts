import { describe, expect, it } from "vitest";
import { getEnvTemplate } from "./env-template";

describe("env-template", () => {
	describe("getEnvTemplate", () => {
		it("returns arktype template when validator is arktype", () => {
			const options = {
				validator: "arktype" as any,
				framework: "node" as any,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain('import arkenv, { type } from "arkenv"');
			expect(template).toContain(
				"NODE_ENV: \"'development' | 'production' | 'test' = 'development'\"",
			);
			expect(template).toContain('PORT: "number.port = 3000"');
			expect(template).toContain("export const env = arkenv(Env)");
		});

		it("returns arktype template with envKeys and defaults", () => {
			const options = {
				validator: "arktype" as any,
				framework: "node" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				envKeys: ["API_KEY"],
			};
			const template = getEnvTemplate(options);
			expect(template).toContain("API_KEY: \"string = ''\"");
			expect(template).not.toContain("NODE_ENV");
		});

		it("returns arktype template for vite when validator is arktype", () => {
			const options = {
				validator: "arktype" as any,
				framework: "vite" as any,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain('import { type } from "arkenv"');
			expect(template).toContain(
				"NODE_ENV: \"'development' | 'production' | 'test' = 'development'\"",
			);
			expect(template).toContain('PORT: "number.port = 3000"');
			expect(template).not.toContain("export const env = arkenv(Env)");
			expect(template).toContain("export const Env = type({");
			expect(template).toContain("use `@arkenv/vite-plugin` to validate these");
			expect(template).toContain(
				"typesafety for `@import.meta.env`".replace("@", ""),
			);
		});

		it("returns arktype template for bun when validator is arktype", () => {
			const options = {
				validator: "arktype" as any,
				framework: "bun" as any,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain('import { type } from "arkenv"');
			expect(template).toContain(
				"NODE_ENV: \"'development' | 'production' | 'test' = 'development'\"",
			);
			expect(template).toContain('PORT: "number.port = 3000"');
			expect(template).not.toContain("export const env = arkenv(Env)");
			expect(template).toContain("export const Env = type({");
			expect(template).toContain(
				"In Bun, use \\`@arkenv/bun-plugin\\`".replace(/\\/g, ""),
			);
			expect(template).toContain("validate these at build-time");
			expect(template).toContain(
				"typesafety for \\`process.env\\`".replace(/\\/g, ""),
			);
		});

		it("returns zod template when validator is zod", () => {
			const options = {
				validator: "zod" as any,
				framework: "node" as any,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain('import { z } from "zod"');
			expect(template).toContain('.default("development")');
			expect(template).toContain(".default(3000)");
		});

		it("returns zod template with envKeys and defaults", () => {
			const options = {
				validator: "zod" as any,
				framework: "node" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				envKeys: ["API_KEY"],
			};
			const template = getEnvTemplate(options);
			expect(template).toContain('API_KEY: z.string().default("")');
		});

		it("returns valibot template when validator is valibot", () => {
			const options = {
				validator: "valibot" as any,
				framework: "node" as any,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain('import * as v from "valibot"');
			expect(template).toContain("v.integer()");
			expect(template).toContain(
				'v.optional(v.picklist(["development", "production", "test"]), "development")',
			);
			expect(template).toContain(
				"v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000)",
			);
		});

		it("returns valibot template with envKeys and defaults", () => {
			const options = {
				validator: "valibot" as any,
				framework: "node" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				envKeys: ["API_KEY"],
			};
			const template = getEnvTemplate(options);
			expect(template).toContain('API_KEY: v.optional(v.string(), "")');
		});

		it("throws error for unsupported validator", () => {
			const options = {
				validator: "unknown" as any,
				framework: "node" as any,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			expect(() => getEnvTemplate(options)).toThrow(
				"Unsupported validator: unknown",
			);
		});
	});
});
