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
			expect(template).toContain("export const env = arkenv(Env)");
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
