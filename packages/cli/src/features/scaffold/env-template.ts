import dedent from "dedent";
import type { ProjectOptions } from "./plan";
import { arktypeTemplate, valibotTemplate, zodTemplate } from "./templates";

/**
 * Generates the complete environment configuration template
 * based on the user's chosen validator and framework.
 *
 * @param options The selected project options.
 * @returns The generated template code.
 */
export function getEnvTemplate(options: ProjectOptions): string {
	const { validator, envKeys, framework } = options;

	switch (validator) {
		case "arktype":
			return `${arktypeTemplate(envKeys, framework)}\n`;
		case "zod":
			return `${zodTemplate(envKeys, framework)}\n`;
		case "valibot":
			return `${valibotTemplate(envKeys, framework)}\n`;
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
 * Generates the shared, client, and server environment configuration templates
 * for the 3-file Strict Next.js layout.
 *
 * @param options The selected project options.
 * @returns The generated templates for all three files.
 */
export function getStrictEnvTemplates(
	options: ProjectOptions,
): StrictEnvTemplates {
	const { validator, envKeys } = options;

	const serverFields: string[] = [];
	const clientFields: string[] = [];
	const sharedFields: string[] = [];
	const runtimeEnvFields: string[] = [];

	if (envKeys && envKeys.length > 0) {
		for (const key of envKeys) {
			if (key.startsWith("NEXT_PUBLIC_")) {
				if (validator === "arktype") {
					clientFields.push(`\t\t${key}: "string?",`);
				} else if (validator === "zod") {
					clientFields.push(`\t\t${key}: z.string().optional(),`);
				} else if (validator === "valibot") {
					clientFields.push(`\t\t${key}: v.optional(v.string()),`);
				}
				runtimeEnvFields.push(`\t\t\t${key}: process.env.${key},`);
			} else if (key === "NODE_ENV" || key === "PORT") {
				if (validator === "arktype") {
					sharedFields.push(
						`\t\t${key}: "${key === "PORT" ? "number.port = 3000" : "'development' | 'production' | 'test' = 'development'"},`,
					);
				} else if (validator === "zod") {
					sharedFields.push(
						`\t\t${key}: ${key === "PORT" ? "z.coerce.number().int().min(1).max(65535).default(3000)" : 'z.enum(["development", "production", "test"]).default("development")'},`,
					);
				} else if (validator === "valibot") {
					sharedFields.push(
						`\t\t${key}: ${key === "PORT" ? "v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000)" : 'v.optional(v.picklist(["development", "production", "test"]), "development")'},`,
					);
				}
				runtimeEnvFields.push(`\t\t\t${key}: process.env.${key},`);
			} else {
				if (validator === "arktype") {
					serverFields.push(`\t\t${key}: "string?",`);
				} else if (validator === "zod") {
					serverFields.push(`\t\t${key}: z.string().optional(),`);
				} else if (validator === "valibot") {
					serverFields.push(`\t\t${key}: v.optional(v.string()),`);
				}
			}
		}
	} else {
		// Use defaults
		if (validator === "arktype") {
			serverFields.push(
				`\t\tDATABASE_URL: "string = 'postgres://localhost:5432/mydb'",`,
			);
			clientFields.push(
				`\t\tNEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",`,
			);
			sharedFields.push(
				`\t\tNODE_ENV: "'development' | 'production' | 'test' = 'development'",`,
			);
		} else if (validator === "zod") {
			serverFields.push(
				`\t\tDATABASE_URL: z.string().url().default("postgres://localhost:5432/mydb"),`,
			);
			clientFields.push(
				`\t\tNEXT_PUBLIC_API_URL: z.string().url().default("https://api.example.com"),`,
			);
			sharedFields.push(
				`\t\tNODE_ENV: z.enum(["development", "production", "test"]).default("development"),`,
			);
		} else if (validator === "valibot") {
			serverFields.push(
				`\t\tDATABASE_URL: v.optional(v.pipe(v.string(), v.url()), "postgres://localhost:5432/mydb"),`,
			);
			clientFields.push(
				`\t\tNEXT_PUBLIC_API_URL: v.optional(v.pipe(v.string(), v.url()), "https://api.example.com"),`,
			);
			sharedFields.push(
				`\t\tNODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),`,
			);
		}
		runtimeEnvFields.push(
			"\t\t\tNEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,",
			"\t\t\tNODE_ENV: process.env.NODE_ENV,",
		);
	}

	let shared = "";
	let client = "";
	let server = "";

	if (validator === "arktype") {
		shared = dedent /* ts */`
			import { type } from "@arkenv/nextjs/shared";

			export const SharedEnv = type({
			${sharedFields.join("\n")}
			});
		`;

		client = dedent /* ts */`
			import { createEnv } from "@arkenv/nextjs/client";
			import { SharedEnv } from "./env.shared";

			export const env = createEnv(
				{
				${clientFields.join("\n")}
				},
				{
					extends: [SharedEnv],
					runtimeEnv: {
					${runtimeEnvFields.join("\n")}
					},
				},
			);
		`;

		server = dedent /* ts */`
			import { createEnv } from "@arkenv/nextjs/server";
			import { env as clientEnv } from "./env.client";

			export const env = createEnv(
				{
				${serverFields.join("\n")}
				},
				{
					extends: [clientEnv],
				},
			);
		`;
	} else if (validator === "zod") {
		shared = dedent /* ts */`
			import { z } from "zod";

			export const SharedEnv = z.object({
			${sharedFields.join("\n")}
			});
		`;

		client = dedent /* ts */`
			import { createEnv } from "@arkenv/nextjs/client";
			import { z } from "zod";
			import { SharedEnv } from "./env.shared";

			export const env = createEnv(
				{
				${clientFields.join("\n")}
				},
				{
					extends: [SharedEnv],
					runtimeEnv: {
					${runtimeEnvFields.join("\n")}
					},
				},
			);
		`;

		server = dedent /* ts */`
			import { createEnv } from "@arkenv/nextjs/server";
			import { z } from "zod";
			import { env as clientEnv } from "./env.client";

			export const env = createEnv(
				{
				${serverFields.join("\n")}
				},
				{
					extends: [clientEnv],
				},
			);
		`;
	} else if (validator === "valibot") {
		shared = dedent /* ts */`
			import * as v from "valibot";

			export const SharedEnv = v.object({
			${sharedFields.join("\n")}
			});
		`;

		client = dedent /* ts */`
			import { createEnv } from "@arkenv/nextjs/client";
			import * as v from "valibot";
			import { SharedEnv } from "./env.shared";

			export const env = createEnv(
				{
				${clientFields.join("\n")}
				},
				{
					extends: [SharedEnv],
					runtimeEnv: {
					${runtimeEnvFields.join("\n")}
					},
				},
			);
		`;

		server = dedent /* ts */`
			import { createEnv } from "@arkenv/nextjs/server";
			import * as v from "valibot";
			import { env as clientEnv } from "./env.client";

			export const env = createEnv(
				{
				${serverFields.join("\n")}
				},
				{
					extends: [clientEnv],
				},
			);
		`;
	}

	return {
		shared: `${shared}\n`,
		client: `${client}\n`,
		server: `${server}\n`,
	};
}
