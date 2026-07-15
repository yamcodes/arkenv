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
	layout?: ProjectOptions["layout"];
	disableCodegen?: boolean;
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

/**
 * Exercise strict template generation through the production VALIDATORS seam.
 */
function getStrictTemplates(
	options: TemplateOptions,
	nextjsImportPath?: string,
) {
	const validator = VALIDATORS[options.validator];
	const context = createScaffoldContext(
		options as ProjectOptions,
		nextjsImportPath,
	);
	return validator.getStrictTemplates(options.envKeys ?? [], context);
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
			expect(template).toContain("export const env = arkenv(Env)");
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
			expect(template).toContain('import arkenv from "./generated/env.gen"');
			expect(template).toContain("DATABASE_URL:");
			expect(template).toContain("NEXT_PUBLIC_API_URL:");
			expect(template).toContain("NODE_ENV:");
			expect(template).not.toContain("shared:");
			expect(template).not.toContain("runtimeEnv:");
		});

		it("returns nextjs flat layout template when layout is flat", () => {
			const options = {
				validator: "arktype" as const,
				framework: "nextjs" as const,
				layout: "flat" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv from "./generated/env.gen"');
			expect(template).toContain("DATABASE_URL:");
			expect(template).not.toContain("server:");
			expect(template).not.toContain("client:");
			expect(template).not.toContain("shared:");
		});

		it("returns nuxt flat layout template when layout is flat", () => {
			const options = {
				validator: "arktype" as const,
				framework: "nuxt" as const,
				layout: "flat" as const,
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

		it("returns nextjs nested layout template when layout is simple", () => {
			const options = {
				validator: "arktype" as const,
				framework: "nextjs" as const,
				layout: "simple" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv from "./generated/env.gen"');
			expect(template).toContain("server:");
			expect(template).toContain("client:");
			expect(template).toContain("shared:");
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
			const template = getSimpleTemplate(options, "@/generated/env.gen");
			expect(template).toContain('import arkenv from "@/generated/env.gen"');
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
			expect(template).toContain('import arkenv from "./generated/env.gen"');
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
			expect(template).toContain('import arkenv from "./generated/env.gen"');
			expect(template).toContain('import { z } from "zod"');
			expect(template).toContain("DATABASE_URL: z.string().url().default(");
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
			expect(template).toContain('import arkenv from "./generated/env.gen"');
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
			expect(template).toContain('import { type } from "@arkenv/core"');
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
				validator: "arktype" as const,
				framework: "bun-fullstack" as const,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import { type } from "@arkenv/core"');
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
				validator: "zod" as const,
				framework: "vanilla" as const,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import arkenv from "@arkenv/standard"');
			expect(template).toContain('import { z } from "zod"');
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
			expect(template).toContain('import { type } from "@arkenv/core"');
			expect(template).toContain('import { z } from "zod"');
			expect(template).toContain("export const Env = type({");
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
			expect(template).toContain('import arkenv from "@arkenv/standard"');
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
				validator: "valibot" as const,
				framework: "vite" as const,
				path: ".env.config.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getSimpleTemplate(options);
			expect(template).toContain('import { type } from "@arkenv/core"');
			expect(template).toContain('import * as v from "valibot"');
			expect(template).toContain("export const Env = type({");
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

	describe("getStrictTemplates", () => {
		it("returns strict templates with codegen enabled", () => {
			const options = {
				validator: "zod" as const,
				framework: "nextjs" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				disableCodegen: false,
			};
			const templates = getStrictTemplates(options);
			expect(templates.shared).toContain(
				"export const SharedSchema = z.object({",
			);
			expect(templates.client).toContain(
				'import arkenv from "./generated/env.gen";',
			);
			expect(templates.client).toContain("export const env = arkenv(");
			expect(templates.client).not.toContain(
				"NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,",
			);
			expect(templates.server).toContain("extends: [clientEnv],");
		});

		it("returns strict templates with custom nextjsImportPath", () => {
			const options = {
				validator: "zod" as const,
				framework: "nextjs" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				disableCodegen: false,
			};
			const templates = getStrictTemplates(options, "@/generated/env.gen");
			expect(templates.client).toContain(
				'import arkenv from "@/generated/env.gen";',
			);
		});

		it("returns strict templates with codegen disabled", () => {
			const options = {
				validator: "zod" as const,
				framework: "nextjs" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				disableCodegen: true,
			};
			const templates = getStrictTemplates(options);
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
				validator: "zod" as const,
				framework: "nextjs" as const,
				path: "env.ts",
				language: "ts" as const,
				shouldUpdateTsConfig: false,
				shouldInstall: false,
				disableCodegen: false,
				envKeys: ["DATABASE_URL"], // Only a server key, no client keys, no shared keys
			};
			const templates = getStrictTemplates(options);
			expect(templates.client).toContain(
				"arkenv(\n\t{},\n\t{\n\t\textends: [SharedSchema],",
			);
			expect(templates.shared).toContain(
				"export const SharedSchema = z.object({});",
			);
		});
	});
});
