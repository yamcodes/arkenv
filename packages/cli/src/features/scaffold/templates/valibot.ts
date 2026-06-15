import dedent from "dedent";
import { buildNextjsTemplate } from "./nextjs-template";

/**
 * Generate a TypeScript template string for a Valibot environment configuration.
 *
 * @param envKeys Optional array of environment variable keys to include in the schema
 * @param framework The framework being used (vite, bun-fullstack, or vanilla)
 * @param nextjsImportPath The optional custom import path for the generated file in Next.js
 * @returns The generated TypeScript template string
 */
export const valibotTemplate = (
	envKeys?: string[],
	framework?: string,
	nextjsImportPath?: string,
	disableCodegen?: boolean,
) => {
	const schemaFields = envKeys?.length
		? envKeys.map((key) => `\t\t${key}: v.optional(v.string()),`).join("\n")
		: `\t\tNODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),
		PORT: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000),`;

	if (framework === "vite") {
		return dedent /* ts */`
	import { type } from "arkenv";
	import * as v from "valibot";

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
	import * as v from "valibot";

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
				extraImports: `import * as v from "valibot";`,
				serverField: (key) => `\t\t${key}: v.optional(v.string()),`,
				clientField: (key) => `\t\t${key}: v.optional(v.string()),`,
				sharedField: (key) =>
					`\t\t${key}: v.optional(v.picklist(["development", "production", "test"]), "development"),`,
				defaultServerFields: [
					`\t\tDATABASE_URL: v.optional(v.pipe(v.string(), v.url()), "postgres://localhost:5432/mydb"),`,
				],
				defaultClientFields: [
					`\t\t${clientPrefix}API_URL: v.optional(v.pipe(v.string(), v.url()), "https://api.example.com"),`,
				],
				defaultSharedFields: [
					`\t\tNODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),`,
				],
			},
			nextjsImportPath,
			disableCodegen,
			framework,
		);
	}

	return dedent /* ts */`
	import arkenv from "arkenv/standard";
	import * as v from "valibot";

	/**
	 * Environment variable schema for server-side or runtime-only validation.
	 */
	export const env = arkenv({
	${schemaFields}
	});
`;
};
