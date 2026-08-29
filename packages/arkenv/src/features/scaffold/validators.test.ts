import { describe, expect, it } from "vitest";
import type { Framework, ProjectOptions, Validator } from "./plan";
import { createScaffoldContext } from "./scaffold-context";
import { VALIDATORS } from "./validators";

type TemplateOptions = {
	validator: Validator;
	framework: Framework;
	path?: string;
	language?: "ts";
	envKeys?: string[];
	disableCodegen?: boolean;
	hostPreset?: ProjectOptions["hostPreset"];
};

/**
 * Exercise template generation through the production VALIDATORS seam.
 */
function getSimpleTemplate(
	options: TemplateOptions,
	nextjsImportPath?: string,
): string {
	const validator = VALIDATORS[options.validator];
	const context = createScaffoldContext(
		options as ProjectOptions,
		nextjsImportPath,
	);
	return validator.getSimpleTemplate(options.envKeys ?? [], context);
}

describe("validators templates", () => {
	describe("getSimpleTemplate", () => {
		it("returns arktype template when validator is arktype", () => {
			const options = {
				validator: "arktype" as const,
				framework: "vanilla" as const,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv, { type } from "@arkenv/core"');
			expect(template).toContain(
				"NODE_ENV: \"'development' | 'production' | 'test' = 'development'\"",
			);
			expect(template).toContain('PORT: "number.port = 3000"');
			expect(template).toContain("export const env = arkenv({");
		});

		it("returns arktype template with envKeys and defaults", () => {
			const options = {
				validator: "arktype" as const,
				framework: "vanilla" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				envKeys: ["API_KEY"],
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('API_KEY: "string?"');
			expect(template).not.toContain("NODE_ENV");
		});

		it("returns nextjs template with defaults", () => {
			const options = {
				validator: "arktype" as const,
				framework: "nextjs" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv from "@/.arkenv"');
			expect(template).toContain("DATABASE_URL:");
			expect(template).toContain("NEXT_PUBLIC_API_URL:");
			expect(template).toContain("NODE_ENV:");
			expect(template).not.toContain("shared:");
			expect(template).not.toContain("runtimeEnv:");
		});

		it("returns nextjs flat template", () => {
			const options = {
				validator: "arktype" as const,
				framework: "nextjs" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv from "@/.arkenv"');
			expect(template).toContain("DATABASE_URL:");
			expect(template).not.toContain("server:");
			expect(template).not.toContain("client:");
			expect(template).not.toContain("shared:");
		});

		it("returns nuxt flat template", () => {
			const options = {
				validator: "arktype" as const,
				framework: "nuxt" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				disableCodegen: true,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv from "@arkenv/nuxt"');
			expect(template).toContain("DATABASE_URL:");
			expect(template).toContain("NUXT_PUBLIC_API_URL:");
			expect(template).not.toContain("server:");
			expect(template).not.toContain("client:");
			expect(template).not.toContain("shared:");
			expect(template).not.toContain("runtimeEnv:");
		});

		it("returns nextjs template with custom nextjsImportPath", () => {
			const options = {
				validator: "arktype" as const,
				framework: "nextjs" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options, "@/.arkenv");
			expect(template).toContain('import arkenv from "@/.arkenv"');
		});

		it("returns nextjs template with custom envKeys split correctly", () => {
			const options = {
				validator: "arktype" as const,
				framework: "nextjs" as const,
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
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv from "@/.arkenv"');
			expect(template).toContain("DATABASE_URL:");
			expect(template).toContain("CUSTOM_VAR:");
			expect(template).toContain("NEXT_PUBLIC_API_KEY:");
			expect(template).toContain("PORT:");
			expect(template).toContain("NODE_ENV:");
			expect(template).not.toContain("runtimeEnv:");
		});

		it("returns nextjs template for zod when validator is zod", () => {
			const options = {
				validator: "zod" as const,
				framework: "nextjs" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv from "@/.arkenv"');
			expect(template).toContain('import * as z from "zod"');
			expect(template).toContain("DATABASE_URL: z.url().default(");
		});

		it("returns nextjs template for valibot when validator is valibot", () => {
			const options = {
				validator: "valibot" as const,
				framework: "nextjs" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv from "@/.arkenv"');
			expect(template).toContain('import * as v from "valibot"');
			expect(template).toContain(
				"DATABASE_URL: v.optional(v.pipe(v.string(), v.url())",
			);
		});

		it("returns arktype template for vite when validator is arktype", () => {
			const options = {
				validator: "arktype" as const,
				framework: "vite" as const,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv, { type } from "@arkenv/core"');
			expect(template).toContain(
				"NODE_ENV: \"'development' | 'production' | 'test' = 'development'\"",
			);
			expect(template).toContain('PORT: "number.port = 3000"');
			expect(template).toContain("export const env = arkenv({");
		});

		it("returns arktype template for bun-fullstack when validator is arktype", () => {
			const options = {
				validator: "arktype" as const,
				framework: "bun-fullstack" as const,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv, { type } from "@arkenv/core"');
			expect(template).toContain(
				"NODE_ENV: \"'development' | 'production' | 'test' = 'development'\"",
			);
			expect(template).toContain('PORT: "number.port = 3000"');
			expect(template).toContain("export const env = arkenv({");
		});

		it("returns zod template when validator is zod", () => {
			const options = {
				validator: "zod" as const,
				framework: "vanilla" as const,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv from "@arkenv/standard"');
			expect(template).toContain('import * as z from "zod"');
			expect(template).toContain('.default("development")');
			expect(template).toContain(".default(3000)");
			expect(template).toContain("export const env = arkenv({");
			expect(template).not.toContain("export const Env =");
		});

		it("returns zod template for vite when validator is zod", () => {
			const options = {
				validator: "zod" as const,
				framework: "vite" as const,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv from "@arkenv/standard"');
			expect(template).toContain('import * as z from "zod"');
			expect(template).toContain("export const env = arkenv({");
		});

		it("returns zod template with envKeys and defaults", () => {
			const options = {
				validator: "zod" as const,
				framework: "vanilla" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				envKeys: ["API_KEY"],
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain("API_KEY: z.string().optional()");
		});

		it("returns valibot template when validator is valibot", () => {
			const options = {
				validator: "valibot" as const,
				framework: "vanilla" as const,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain(
				'import { arkenv } from "@arkenv/standard/valibot"',
			);
			expect(template).not.toContain("toJsonSchema");
			expect(template).toContain('import * as v from "valibot"');
			expect(template).toContain("v.integer()");
			expect(template).toContain(
				'v.optional(v.picklist(["development", "production", "test"]), "development")',
			);
			expect(template).toContain(
				"v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000)",
			);
			expect(template).toContain("export const env = arkenv({");
			expect(template).not.toContain("export const Env =");
		});

		it("returns valibot template for vite when validator is valibot", () => {
			const options = {
				validator: "valibot" as const,
				framework: "vite" as const,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain(
				'import { arkenv } from "@arkenv/standard/valibot"',
			);
			expect(template).not.toContain("toJsonSchema");
			expect(template).toContain('import * as v from "valibot"');
			expect(template).toContain("export const env = arkenv({");
		});

		it("returns valibot template with envKeys and defaults", () => {
			const options = {
				validator: "valibot" as const,
				framework: "vanilla" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				envKeys: ["API_KEY"],
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain("API_KEY: v.optional(v.string())");
		});
	});

	describe("hosting presets", () => {
		it("includes Vercel preset with ArkType validator", () => {
			const options = {
				validator: "arktype" as const,
				framework: "vanilla" as const,
				path: "env.ts",
				language: "ts" as const,
				hostPreset: "vercel" as const,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain("// @arkenv-preset-start vercel");
			expect(template).toContain('VERCEL: "string?"');
			expect(template).toContain(
				"VERCEL_ENV: \"'production' | 'preview' | 'development'?\"",
			);
			expect(template).toContain('VERCEL_URL: "string?"');
			expect(template).toContain("// @arkenv-preset-end vercel");
		});

		it("includes Vercel preset with Zod validator for Next.js", () => {
			const options = {
				validator: "zod" as const,
				framework: "nextjs" as const,
				path: "env.ts",
				language: "ts" as const,
				hostPreset: "vercel" as const,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain("// @arkenv-preset-start vercel");
			expect(template).toContain("VERCEL: z.string().optional()");
			expect(template).toContain(
				'VERCEL_ENV: z.enum(["production", "preview", "development"]).optional()',
			);
			expect(template).toContain(
				'NEXT_PUBLIC_VERCEL_ENV: z.enum(["production", "preview", "development"]).optional()',
			);
			expect(template).toContain(
				"NEXT_PUBLIC_VERCEL_URL: z.string().optional()",
			);
			expect(template).toContain("// @arkenv-preset-end vercel");
		});

		it("prefixes Vite client keys via framework clientPrefix", () => {
			const options = {
				validator: "arktype" as const,
				framework: "vite" as const,
				path: "env.ts",
				language: "ts" as const,
				hostPreset: "vercel" as const,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('VERCEL: "string?"');
			expect(template).toContain("VITE_VERCEL_ENV:");
			expect(template).toContain('VITE_VERCEL_URL: "string?"');
		});

		it("includes preset client keys in no-codegen runtimeEnv for flat Next.js", () => {
			const options = {
				validator: "zod" as const,
				framework: "nextjs" as const,
				path: "env.ts",
				language: "ts" as const,
				disableCodegen: true,
				hostPreset: "vercel" as const,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain("runtimeEnv: {");
			expect(template).toContain(
				"NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,",
			);
			expect(template).toContain(
				"NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,",
			);
			expect(template).toContain(
				"NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,",
			);
		});

		it("does not apply preset field kinds when no hostPreset is selected", () => {
			const options = {
				validator: "arktype" as const,
				framework: "vanilla" as const,
				path: "env.ts",
				language: "ts" as const,
				envKeys: ["VERCEL_ENV"],
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('VERCEL_ENV: "string?"');
			expect(template).not.toContain("production' | 'preview");
		});
	});
});
