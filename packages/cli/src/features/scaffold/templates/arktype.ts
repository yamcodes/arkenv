import dedent from "dedent";
import { buildNextjsTemplate } from "./nextjs-template";

/**
 * Generate a TypeScript template string for an ArkType environment configuration.
 *
 * @param envKeys Optional array of environment variable keys to include in the schema
 * @param framework The framework being used (vite, bun-fullstack, or vanilla)
 * @param nextjsImportPath The optional custom import path for the generated file in Next.js
 * @returns The generated TypeScript template string
 */
export const arktypeTemplate = (
	envKeys?: string[],
	framework?: string,
	nextjsImportPath?: string,
) => {
	const schemaFields = envKeys?.length
		? envKeys.map((key) => `\t\t${key}: "string?",`).join("\n")
		: `\t\tNODE_ENV: "'development' | 'production' | 'test' = 'development'",
\t\tPORT: "number.port = 3000",`;

	if (framework === "vite") {
		return dedent /* ts */`
	import { type } from "arkenv";

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

	if (framework === "nextjs") {
		return buildNextjsTemplate(
			envKeys,
			{
				serverField: (key) => `\t\t${key}: "string?",`,
				clientField: (key) => `\t\t${key}: "string?",`,
				sharedField: (key, isPort) =>
					`\t\t${key}: "${isPort ? "number.port = 3000" : "'development' | 'production' | 'test' = 'development'"}",`,
				defaultServerFields: [
					`\t\tDATABASE_URL: "string = 'postgres://localhost:5432/mydb'",`,
				],
				defaultClientFields: [
					`\t\tNEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",`,
				],
				defaultSharedFields: [
					`\t\tNODE_ENV: "'development' | 'production' | 'test' = 'development'",`,
				],
			},
			nextjsImportPath,
		);
	}

	return dedent /* ts */`
	import arkenv, { type } from "arkenv";

	/**
	 * Environment variable schema for server-side or runtime-only validation.
	 */
	export const Env = type({
${schemaFields}
	});

	export const env = arkenv(Env);
`;
};
