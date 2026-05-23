import dedent from "dedent";

/**
 * Generates a TypeScript template string for a Valibot environment configuration.
 *
 * @param envKeys - Optional array of environment variable keys to include in the schema.
 * @param framework - The framework being used (vite, bun-fullstack, or vanilla).
 * @returns The generated TypeScript template string.
 */
export const valibotTemplate = (envKeys?: string[], framework?: string) => {
	const schemaFields = envKeys?.length
		? envKeys.map((key) => `\t\t${key}: v.optional(v.string(), ""),`).join("\n")
		: `\t\tNODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),
\t\tPORT: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000),`;

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

	if (framework === "nextjs") {
		const serverFields: string[] = [];
		const clientFields: string[] = [];
		const sharedFields: string[] = [];
		const runtimeEnvFields: string[] = [];

		if (envKeys && envKeys.length > 0) {
			for (const key of envKeys) {
				if (key.startsWith("NEXT_PUBLIC_")) {
					clientFields.push(`\t\t${key}: v.optional(v.string(), ""),`);
					runtimeEnvFields.push(`\t\t${key}: process.env.${key},`);
				} else if (key === "NODE_ENV" || key === "PORT") {
					sharedFields.push(
						`\t\t${key}: ${key === "PORT" ? "v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000)" : 'v.optional(v.picklist(["development", "production", "test"]), "development")'},`,
					);
					runtimeEnvFields.push(`\t\t${key}: process.env.${key},`);
				} else {
					serverFields.push(`\t\t${key}: v.optional(v.string(), ""),`);
				}
			}
		} else {
			serverFields.push(
				`\t\tDATABASE_URL: v.optional(v.pipe(v.string(), v.url()), "postgres://localhost:5432/mydb"),`,
			);
			clientFields.push(
				`\t\tNEXT_PUBLIC_API_URL: v.optional(v.pipe(v.string(), v.url()), "https://api.example.com"),`,
			);
			sharedFields.push(
				`\t\tNODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),`,
			);
			runtimeEnvFields.push(
				"\t\tNEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,",
			);
			runtimeEnvFields.push("\t\tNODE_ENV: process.env.NODE_ENV,");
		}

		return dedent /* ts */`
		import arkenv from "@arkenv/nextjs";
		import * as v from "valibot";

		/**
		 * Environment variable schema.
		 * In Next.js, use \`@arkenv/nextjs\` to validate variables at build-time and runtime.
		 * Enforces client/server separation and prevents secret leaks.
		 */
		export const env = arkenv({
			server: {
		${serverFields.join("\n")}
			},
			client: {
		${clientFields.join("\n")}
			},
			shared: {
		${sharedFields.join("\n")}
			},
			runtimeEnv: {
		${runtimeEnvFields.join("\n")}
			},
		});
		`;
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
