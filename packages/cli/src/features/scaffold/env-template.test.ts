import { describe, expect, it } from "vitest";
import { getEnvTemplate, getStrictEnvTemplates } from "./env-template";

describe("env-template", () => {
	describe("getEnvTemplate", () => {
		it("returns arktype template when validator is arktype", () => {
			const options = {
				validator: "arktype" as any,
				framework: "vanilla" as any,
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
				framework: "vanilla" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				envKeys: ["API_KEY"],
			};
			const template = getEnvTemplate(options);
			expect(template).toContain('API_KEY: "string?"');
			expect(template).not.toContain("NODE_ENV");
		});

		it("returns nextjs template with defaults", () => {
			const options = {
				validator: "arktype" as any,
				framework: "nextjs" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain(
				'import { createEnv } from "./generated/env.gen"',
			);
			expect(template).toContain("server: {");
			expect(template).toContain("DATABASE_URL:");
			expect(template).toContain("client: {");
			expect(template).toContain("NEXT_PUBLIC_API_URL:");
			expect(template).toContain("shared: {");
			expect(template).toContain("NODE_ENV:");
			expect(template).not.toContain("runtimeEnv:");
		});

		it("returns nextjs template with custom nextjsImportPath", () => {
			const options = {
				validator: "arktype" as any,
				framework: "nextjs" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options, "@/generated/env.gen");
			expect(template).toContain(
				'import { createEnv } from "@/generated/env.gen"',
			);
		});

		it("returns nextjs template with custom envKeys split correctly", () => {
			const options = {
				validator: "arktype" as any,
				framework: "nextjs" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				envKeys: [
					"DATABASE_URL",
					"NEXT_PUBLIC_API_KEY",
					"PORT",
					"NODE_ENV",
					"CUSTOM_VAR",
				],
			};
			const template = getEnvTemplate(options);
			expect(template).toContain(
				'import { createEnv } from "./generated/env.gen"',
			);
			expect(template).toContain("DATABASE_URL:");
			expect(template).toContain("CUSTOM_VAR:");
			expect(template).toContain("NEXT_PUBLIC_API_KEY:");
			expect(template).toContain("PORT:");
			expect(template).toContain("NODE_ENV:");
			expect(template).not.toContain("runtimeEnv:");
		});

		it("returns nextjs template for zod when validator is zod", () => {
			const options = {
				validator: "zod" as any,
				framework: "nextjs" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain(
				'import { createEnv } from "./generated/env.gen"',
			);
			expect(template).toContain('import { z } from "zod"');
			expect(template).toContain("DATABASE_URL: z.string().url().default(");
		});

		it("returns nextjs template for valibot when validator is valibot", () => {
			const options = {
				validator: "valibot" as any,
				framework: "nextjs" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain(
				'import { createEnv } from "./generated/env.gen"',
			);
			expect(template).toContain('import * as v from "valibot"');
			expect(template).toContain(
				"DATABASE_URL: v.optional(v.pipe(v.string(), v.url())",
			);
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

		it("returns arktype template for bun-fullstack when validator is arktype", () => {
			const options = {
				validator: "arktype" as any,
				framework: "bun-fullstack" as any,
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
				"In Bun Fullstack, use \\`@arkenv/bun-plugin\\`".replace(/\\/g, ""),
			);
			expect(template).toContain("validate these at build-time");
			expect(template).toContain(
				"typesafety for \\`process.env\\`".replace(/\\/g, ""),
			);
		});

		it("returns zod template when validator is zod", () => {
			const options = {
				validator: "zod" as any,
				framework: "vanilla" as any,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain('import arkenv from "arkenv/standard"');
			expect(template).toContain('import { z } from "zod"');
			expect(template).toContain('.default("development")');
			expect(template).toContain(".default(3000)");
			expect(template).toContain("export const env = arkenv({");
			expect(template).not.toContain("export const Env =");
		});

		it("returns zod template for vite when validator is zod", () => {
			const options = {
				validator: "zod" as any,
				framework: "vite" as any,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain('import { type } from "arkenv"');
			expect(template).toContain('import { z } from "zod"');
			expect(template).toContain("export const Env = type({");
		});

		it("returns zod template with envKeys and defaults", () => {
			const options = {
				validator: "zod" as any,
				framework: "vanilla" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				envKeys: ["API_KEY"],
			};
			const template = getEnvTemplate(options);
			expect(template).toContain("API_KEY: z.string().optional()");
		});

		it("returns valibot template when validator is valibot", () => {
			const options = {
				validator: "valibot" as any,
				framework: "vanilla" as any,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain('import arkenv from "arkenv/standard"');
			expect(template).toContain('import * as v from "valibot"');
			expect(template).toContain("v.integer()");
			expect(template).toContain(
				'v.optional(v.picklist(["development", "production", "test"]), "development")',
			);
			expect(template).toContain(
				"v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000)",
			);
			expect(template).toContain("export const env = arkenv({");
			expect(template).not.toContain("export const Env =");
		});

		it("returns valibot template for vite when validator is valibot", () => {
			const options = {
				validator: "valibot" as any,
				framework: "vite" as any,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain('import { type } from "arkenv"');
			expect(template).toContain('import * as v from "valibot"');
			expect(template).toContain("export const Env = type({");
		});

		it("returns valibot template with envKeys and defaults", () => {
			const options = {
				validator: "valibot" as any,
				framework: "vanilla" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				envKeys: ["API_KEY"],
			};
			const template = getEnvTemplate(options);
			expect(template).toContain("API_KEY: v.optional(v.string())");
		});

		it("throws error for unsupported validator", () => {
			const options = {
				validator: "unknown" as any,
				framework: "vanilla" as any,
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

	describe("getStrictEnvTemplates", () => {
		it("returns strict templates with codegen enabled", () => {
			const options = {
				validator: "zod" as any,
				framework: "nextjs" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				disableCodegen: false,
			};
			const templates = getStrictEnvTemplates(options);
			expect(templates.shared).toContain(
				"export const SharedSchema = z.object({",
			);
			expect(templates.client).toContain(
				'import { runtimeEnv } from "./generated/env.gen";',
			);
			expect(templates.client).toContain("runtimeEnv,");
			expect(templates.client).not.toContain(
				"NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,",
			);
			expect(templates.server).toContain("extends: [clientEnv],");
		});

		it("returns strict templates with codegen disabled", () => {
			const options = {
				validator: "zod" as any,
				framework: "nextjs" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				disableCodegen: true,
			};
			const templates = getStrictEnvTemplates(options);
			expect(templates.shared).toContain(
				"export const SharedSchema = z.object({",
			);
			expect(templates.client).not.toContain(
				'import { runtimeEnv } from "./generated/env.gen";',
			);
			expect(templates.client).toContain("runtimeEnv: {");
			expect(templates.client).toContain(
				"NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,",
			);
			expect(templates.server).toContain("extends: [clientEnv],");
		});

		it("generates cleanly formatted empty objects when no client keys are present", () => {
			const options = {
				validator: "zod" as any,
				framework: "nextjs" as any,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				disableCodegen: false,
				envKeys: ["DATABASE_URL"], // Only a server key, no client keys, no shared keys
			};
			const templates = getStrictEnvTemplates(options);
			expect(templates.client).toContain(
				"arkenv(\n\t{},\n\t{\n\t\textends: [SharedSchema],",
			);
			expect(templates.shared).toContain(
				"export const SharedSchema = z.object({});",
			);
		});
	});
});
