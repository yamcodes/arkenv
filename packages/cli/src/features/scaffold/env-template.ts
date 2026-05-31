import type { ProjectOptions } from "./plan";
import { arktypeTemplate, valibotTemplate, zodTemplate } from "./templates";

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
	const { validator, envKeys, framework, disableCodegen } = options;

	switch (validator) {
		case "arktype":
			return `${arktypeTemplate(envKeys, framework, nextjsImportPath, disableCodegen)}\n`;
		case "zod":
			return `${zodTemplate(envKeys, framework, nextjsImportPath, disableCodegen)}\n`;
		case "valibot":
			return `${valibotTemplate(envKeys, framework, nextjsImportPath, disableCodegen)}\n`;
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
	const { validator, envKeys, disableCodegen } = options;

	const serverFields: string[] = [];
	const clientFields: string[] = [];
	const sharedFields: string[] = [];
	const runtimeEnvFields: string[] = [];

	if (envKeys && envKeys.length > 0) {
		for (const key of envKeys) {
			if (key.startsWith("NEXT_PUBLIC_")) {
				if (validator === "arktype") {
					clientFields.push(`${key}: "string?",`);
				} else if (validator === "zod") {
					clientFields.push(`${key}: z.string().optional(),`);
				} else if (validator === "valibot") {
					clientFields.push(`${key}: v.optional(v.string()),`);
				}
				runtimeEnvFields.push(`${key}: process.env.${key},`);
			} else if (key === "NODE_ENV" || key === "PORT") {
				if (validator === "arktype") {
					sharedFields.push(
						`${key}: "${key === "PORT" ? "number.port = 3000" : "'development' | 'production' | 'test' = 'development'"}",`,
					);
				} else if (validator === "zod") {
					sharedFields.push(
						`${key}: ${key === "PORT" ? "z.coerce.number().int().min(1).max(65535).default(3000)" : 'z.enum(["development", "production", "test"]).default("development")'},`,
					);
				} else if (validator === "valibot") {
					sharedFields.push(
						`${key}: ${key === "PORT" ? "v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000)" : 'v.optional(v.picklist(["development", "production", "test"]), "development")'},`,
					);
				}
				runtimeEnvFields.push(`${key}: process.env.${key},`);
			} else {
				if (validator === "arktype") {
					serverFields.push(`${key}: "string?",`);
				} else if (validator === "zod") {
					serverFields.push(`${key}: z.string().optional(),`);
				} else if (validator === "valibot") {
					serverFields.push(`${key}: v.optional(v.string()),`);
				}
			}
		}
	} else {
		// Use defaults
		if (validator === "arktype") {
			serverFields.push(
				`DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",`,
			);
			clientFields.push(
				`NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",`,
			);
			sharedFields.push(
				`NODE_ENV: "'development' | 'production' | 'test' = 'development'",`,
			);
		} else if (validator === "zod") {
			serverFields.push(
				`DATABASE_URL: z.string().url().default("postgres://localhost:5432/mydb"),`,
			);
			clientFields.push(
				`NEXT_PUBLIC_API_URL: z.string().url().default("https://api.example.com"),`,
			);
			sharedFields.push(
				`NODE_ENV: z.enum(["development", "production", "test"]).default("development"),`,
			);
		} else if (validator === "valibot") {
			serverFields.push(
				`DATABASE_URL: v.optional(v.pipe(v.string(), v.url()), "postgres://localhost:5432/mydb"),`,
			);
			clientFields.push(
				`NEXT_PUBLIC_API_URL: v.optional(v.pipe(v.string(), v.url()), "https://api.example.com"),`,
			);
			sharedFields.push(
				`NODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),`,
			);
		}
		runtimeEnvFields.push(
			"NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,",
			"NODE_ENV: process.env.NODE_ENV,",
		);
	}

	let shared = "";
	let client = "";
	let server = "";

	if (validator === "arktype") {
		shared = `import { type } from "@arkenv/nextjs/shared";

/**
 * @internal 🛑 INTERNAL SCHEMA ONLY.
 * Do not import this directly. Import \`env\` from \`./client\` or \`./server\` instead.
 */
export const SharedSchema = type(${formatSchemaObject(sharedFields, "\t")});`;

		client = disableCodegen
			? `import arkenv from "@arkenv/nextjs/client";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema],
		runtimeEnv: {
			${runtimeEnvFields.map((f) => f.trim()).join("\n\t\t\t")}
		},
	},
);`
			: `import { createEnv } from "${nextjsImportPath || "./generated/env.gen"}";
import { SharedSchema } from "./internal/shared";

export const env = createEnv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema],
	},
);`;

		server = `import arkenv from "@arkenv/nextjs/server";
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
			? `import arkenv from "@arkenv/nextjs/client";
import { z } from "zod";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema],
		runtimeEnv: {
			${runtimeEnvFields.map((f) => f.trim()).join("\n\t\t\t")}
		},
	},
);`
			: `import { createEnv } from "${nextjsImportPath || "./generated/env.gen"}";
import { z } from "zod";
import { SharedSchema } from "./internal/shared";

export const env = createEnv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema],
	},
);`;

		server = `import arkenv from "@arkenv/nextjs/server";
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
			? `import arkenv from "@arkenv/nextjs/client";
import * as v from "valibot";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema],
		runtimeEnv: {
			${runtimeEnvFields.map((f) => f.trim()).join("\n\t\t\t")}
		},
	},
);`
			: `import { createEnv } from "${nextjsImportPath || "./generated/env.gen"}";
import * as v from "valibot";
import { SharedSchema } from "./internal/shared";

export const env = createEnv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema],
	},
);`;

		server = `import arkenv from "@arkenv/nextjs/server";
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
