import type { ProjectOptions } from "./plan";
import { arktypeTemplate, valibotTemplate, zodTemplate } from "./templates";
import { getPresetKeys, getFieldDefinition } from "./templates/presets";

/**
 * Generate the complete environment configuration template
 * based on the user's chosen validator and framework.
 *
 * @param options The selected project options
 * @param nextjsImportPath The optional custom import path for the generated file in Next.js
 * @returns The generated template code
 */
export function getEnvTemplate(
	options: ProjectOptions,
	nextjsImportPath?: string,
): string {
	const { validator, envKeys, framework, disableCodegen, layout, hostPreset } = options;

	switch (validator) {
		case "arktype":
			return `${arktypeTemplate(envKeys, framework, nextjsImportPath, disableCodegen, layout, hostPreset)}\n`;
		case "zod":
			return `${zodTemplate(envKeys, framework, nextjsImportPath, disableCodegen, layout, hostPreset)}\n`;
		case "valibot":
			return `${valibotTemplate(envKeys, framework, nextjsImportPath, disableCodegen, layout, hostPreset)}\n`;
		default:
			throw new Error(`Unsupported validator: ${validator}`);
	}
}

export type StrictEnvTemplates = {
	shared: string;
	client: string;
	server: string;
};

/**
 * Format an array of schema field strings as a braced object literal.
 *
 * Returns `"{}"` for an empty field list. Non-empty fields are each trimmed
 * and joined with newlines at the given indentation level.
 *
 * @param fields The schema field strings to format (e.g. `["FOO: \"string\""]`)
 * @param indent The indentation prefix to use for inner lines
 * @returns A formatted object literal string
 */
function formatSchemaObject(fields: string[], indent = "\t\t"): string {
	if (fields.length === 0) {
		return "{}";
	}
	return `{\n${indent}${fields.map((f) => f.trim()).join(`\n${indent}`)}\n${indent.slice(1)}}`;
}

/**
 * Generate the shared, client, and server environment configuration templates
 * for the 3-file Strict Next.js layout.
 *
 * @param options The selected project options.
 * @param nextjsImportPath The optional custom import path for the generated file in Next.js.
 * @returns The generated templates for all three files.
 */
export function getStrictEnvTemplates(
	options: ProjectOptions,
	nextjsImportPath?: string,
): StrictEnvTemplates {
	const { validator, envKeys, hostPreset } = options;
	const disableCodegen = options.disableCodegen || options.framework === "nuxt";

	const serverFields: string[] = [];
	const clientFields: string[] = [];
	const sharedFields: string[] = [];
	const runtimeEnvFields: string[] = [];

	const clientPrefix =
		options.framework === "nuxt" ? "NUXT_PUBLIC_" : "NEXT_PUBLIC_";
	const pkgName =
		options.framework === "nuxt" ? "@arkenv/nuxt" : "@arkenv/nextjs";

	const existingKeys = envKeys && envKeys.length > 0
		? envKeys
		: (options.framework === "nuxt" ? ["DATABASE_URL", "NUXT_PUBLIC_API_URL", "NODE_ENV"] : ["DATABASE_URL", "NEXT_PUBLIC_API_URL", "NODE_ENV"]);

	const presetKeys = hostPreset
		? getPresetKeys(hostPreset, clientPrefix).filter((k) => !existingKeys.includes(k))
		: [];

	if (envKeys && envKeys.length > 0) {
		const combined = Array.from(new Set([...envKeys, ...presetKeys]));
		for (const key of combined) {
			if (key.startsWith(clientPrefix)) {
				clientFields.push(`${key}: ${getFieldDefinition(key, validator, clientPrefix)},`);
				runtimeEnvFields.push(`${key}: process.env.${key},`);
			} else if (key === "NODE_ENV") {
				if (validator === "arktype") {
					sharedFields.push(
						`${key}: "'development' | 'production' | 'test' = 'development'",`,
					);
				} else if (validator === "zod") {
					sharedFields.push(
						`${key}: z.enum(["development", "production", "test"]).default("development"),`,
					);
				} else if (validator === "valibot") {
					sharedFields.push(
						`${key}: v.optional(v.picklist(["development", "production", "test"]), "development"),`,
					);
				}
				runtimeEnvFields.push(`${key}: process.env.${key},`);
			} else {
				if (key === "PORT") {
					if (validator === "arktype") {
						serverFields.push(`PORT: "number.port = 3000",`);
					} else if (validator === "zod") {
						serverFields.push(
							"PORT: z.coerce.number().int().min(1).max(65535).default(3000),",
						);
					} else if (validator === "valibot") {
						serverFields.push(
							"PORT: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000),",
						);
					}
				} else {
					serverFields.push(`${key}: ${getFieldDefinition(key, validator, clientPrefix)},`);
				}
			}
		}
	} else {
		// Use defaults
		const defaultClientKey =
			options.framework === "nuxt"
				? "NUXT_PUBLIC_API_URL"
				: "NEXT_PUBLIC_API_URL";
		if (validator === "arktype") {
			serverFields.push(
				`DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",`,
			);
			clientFields.push(
				`${defaultClientKey}: "string = 'https://api.example.com'",`,
			);
			sharedFields.push(
				`NODE_ENV: "'development' | 'production' | 'test' = 'development'",`,
			);
		} else if (validator === "zod") {
			serverFields.push(
				`DATABASE_URL: z.string().url().default("postgres://localhost:5432/mydb"),`,
			);
			clientFields.push(
				`${defaultClientKey}: z.string().url().default("https://api.example.com"),`,
			);
			sharedFields.push(
				`NODE_ENV: z.enum(["development", "production", "test"]).default("development"),`,
			);
		} else if (validator === "valibot") {
			serverFields.push(
				`DATABASE_URL: v.optional(v.pipe(v.string(), v.url()), "postgres://localhost:5432/mydb"),`,
			);
			clientFields.push(
				`${defaultClientKey}: v.optional(v.pipe(v.string(), v.url()), "https://api.example.com"),`,
			);
			sharedFields.push(
				`NODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),`,
			);
		}
		runtimeEnvFields.push(
			`${defaultClientKey}: process.env.${defaultClientKey},`,
			"NODE_ENV: process.env.NODE_ENV,",
		);

		for (const key of presetKeys) {
			if (key.startsWith(clientPrefix)) {
				clientFields.push(`${key}: ${getFieldDefinition(key, validator, clientPrefix)},`);
				runtimeEnvFields.push(`${key}: process.env.${key},`);
			} else {
				serverFields.push(`${key}: ${getFieldDefinition(key, validator, clientPrefix)},`);
			}
		}
	}

	const runtimeEnvOptions =
		options.framework === "nuxt"
			? ""
			: `,\n\t\truntimeEnv: {\n\t\t\t${runtimeEnvFields.map((f) => f.trim()).join("\n\t\t\t")}\n\t\t}`;

	let shared = "";
	let client = "";
	let server = "";

	if (validator === "arktype") {
		shared = `import { type } from "${pkgName}/shared";

/**
 * @internal 🛑 INTERNAL SCHEMA ONLY.
 * Do not import this directly. Import \`env\` from \`./client\` or \`./server\` instead.
 */
export const SharedSchema = type(${formatSchemaObject(sharedFields, "\t")});`;

		client = disableCodegen
			? `import arkenv from "${pkgName}/client";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema]${runtimeEnvOptions}
	},
);`
			: `import arkenv from "${nextjsImportPath || "./generated/env.gen"}";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema],
	},
);`;

		server = `import arkenv from "${pkgName}/server";
import { env as clientEnv } from "./client";

export const env = arkenv(
	${formatSchemaObject(serverFields, "\t\t")},
	{
		extends: [clientEnv],
	},
);`;
	} else if (validator === "zod") {
		shared = `import { z } from "zod";

/**
 * @internal 🛑 INTERNAL SCHEMA ONLY.
 * Do not import this directly. Import \`env\` from \`./client\` or \`./server\` instead.
 */
export const SharedSchema = z.object(${formatSchemaObject(sharedFields, "\t")});`;

		client = disableCodegen
			? `import arkenv from "${pkgName}/client";
import { z } from "zod";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema]${runtimeEnvOptions}
	},
);`
			: `import arkenv from "${nextjsImportPath || "./generated/env.gen"}";
import { z } from "zod";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema],
	},
);`;

		server = `import arkenv from "${pkgName}/server";
import { z } from "zod";
import { env as clientEnv } from "./client";

export const env = arkenv(
	${formatSchemaObject(serverFields, "\t\t")},
	{
		extends: [clientEnv],
	},
);`;
	} else if (validator === "valibot") {
		shared = `import * as v from "valibot";

/**
 * @internal 🛑 INTERNAL SCHEMA ONLY.
 * Do not import this directly. Import \`env\` from \`./client\` or \`./server\` instead.
 */
export const SharedSchema = v.object(${formatSchemaObject(sharedFields, "\t")});`;

		client = disableCodegen
			? `import arkenv from "${pkgName}/client";
import * as v from "valibot";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema]${runtimeEnvOptions}
	},
);`
			: `import arkenv from "${nextjsImportPath || "./generated/env.gen"}";
import * as v from "valibot";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema],
	},
);`;

		server = `import arkenv from "${pkgName}/server";
import * as v from "valibot";
import { env as clientEnv } from "./client";

export const env = arkenv(
	${formatSchemaObject(serverFields, "\t\t")},
	{
		extends: [clientEnv],
	},
);`;
	}

	return {
		shared: `${shared}\n`,
		client: `${client}\n`,
		server: `${server}\n`,
	};
}
