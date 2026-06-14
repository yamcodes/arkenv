import dedent from "dedent";
import { buildNextjsTemplate } from "./nextjs-template";

/**
 * Generate a TypeScript template string for a Zod environment configuration.
 *
 * @param envKeys Optional array of environment variable keys to include in the schema
 * @param framework The framework being used (vite, bun-fullstack, or vanilla)
 * @param nextjsImportPath The optional custom import path for the generated file in Next.js
 * @returns The generated TypeScript template string
 */
export const zodTemplate = (
	envKeys?: string[],
	framework?: string,
	nextjsImportPath?: string,
	disableCodegen?: boolean,
) => {
	const schemaFields = envKeys?.length
		? envKeys.map((key) => `\t\t${key}: z.string().optional(),`).join("\n")
		: `\t\tNODE_ENV: z.enum(["development", "production", "test"]).default("development"),
		PORT: z.coerce.number().int().min(1).max(65535).default(3000),`;

	if (framework === "vite") {
		return dedent /* ts */`
	import { type } from "arkenv";
	import { z } from "zod";

	/**
	 * Environment variable schema.
	 * In Vite, use \`@arkenv/vite-plugin\` to validate these at build-time
	 * and provide typesafety for \`import.meta.env\` on the client-side.
	 */
	export const Env = type({
		${schemaFields}
	});
	`;
	}

	if (framework === "bun-fullstack") {
		return dedent /* ts */`
	import { type } from "arkenv";
	import { z } from "zod";

	/**
	 * Environment variable schema.
	 * In Bun Fullstack, use \`@arkenv/bun-plugin\` to validate these at build-time
	 * and provide typesafety for \`process.env\` on the client-side.
	 */
	export const Env = type({
		${schemaFields}
	});
	`;
	}

	if (framework === "nextjs" || framework === "nuxt") {
		const clientPrefix = framework === "nuxt" ? "NUXT_PUBLIC_" : "NEXT_PUBLIC_";
		return buildNextjsTemplate(
			envKeys,
			{
				extraImports: `import { z } from "zod";`,
				serverField: (key) => `\t\t${key}: z.string().optional(),`,
				clientField: (key) => `\t\t${key}: z.string().optional(),`,
				sharedField: (key) =>
					`\t\t${key}: z.enum(["development", "production", "test"]).default("development"),`,
				defaultServerFields: [
					`\t\tDATABASE_URL: z.string().url().default("postgres://localhost:5432/mydb"),`,
				],
				defaultClientFields: [
					`\t\t${clientPrefix}API_URL: z.string().url().default("https://api.example.com"),`,
				],
				defaultSharedFields: [
					`\t\tNODE_ENV: z.enum(["development", "production", "test"]).default("development"),`,
				],
			},
			nextjsImportPath,
			disableCodegen,
			framework,
		);
	}

	return dedent /* ts */`
	import arkenv from "arkenv/standard";
	import { z } from "zod";

	/**
	 * Environment variable schema for server-side or runtime-only validation.
	 */
	export const env = arkenv({
	${schemaFields}
	});
`;
};
