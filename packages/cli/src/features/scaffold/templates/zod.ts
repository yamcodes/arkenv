import dedent from "dedent";

/**
 * Generates a TypeScript template string for a Zod environment configuration.
 *
 * @param envKeys - Optional array of environment variable keys to include in the schema.
 * @param framework - The framework being used (vite, bun-fullstack, or vanilla).
 * @returns The generated TypeScript template string.
 */
export const zodTemplate = (envKeys?: string[], framework?: string) => {
	const schemaFields = envKeys?.length
		? envKeys.map((key) => `\t\t${key}: z.string().default(""),`).join("\n")
		: `\t\tNODE_ENV: z.enum(["development", "production", "test"]).default("development"),
\t\tPORT: z.coerce.number().int().min(1).max(65535).default(3000),`;

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

	if (framework === "nextjs") {
		const serverFields: string[] = [];
		const clientFields: string[] = [];
		const sharedFields: string[] = [];
		const runtimeEnvFields: string[] = [];

		if (envKeys && envKeys.length > 0) {
			for (const key of envKeys) {
				if (key.startsWith("NEXT_PUBLIC_")) {
					clientFields.push(`\t\t${key}: z.string().default(""),`);
					runtimeEnvFields.push(`\t\t${key}: process.env.${key},`);
				} else if (key === "NODE_ENV" || key === "PORT") {
					sharedFields.push(
						`\t\t${key}: ${key === "PORT" ? "z.coerce.number().int().min(1).max(65535).default(3000)" : 'z.enum(["development", "production", "test"]).default("development")'},`,
					);
					runtimeEnvFields.push(`\t\t${key}: process.env.${key},`);
				} else {
					serverFields.push(`\t\t${key}: z.string().default(""),`);
				}
			}
		} else {
			serverFields.push(
				`\t\tDATABASE_URL: z.string().url().default("postgres://localhost:5432/mydb"),`,
			);
			clientFields.push(
				`\t\tNEXT_PUBLIC_API_URL: z.string().url().default("https://api.example.com"),`,
			);
			sharedFields.push(
				`\t\tNODE_ENV: z.enum(["development", "production", "test"]).default("development"),`,
			);
			runtimeEnvFields.push(
				"\t\tNEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,",
			);
			runtimeEnvFields.push("\t\tNODE_ENV: process.env.NODE_ENV,");
		}

		const sections: string[] = [];
		if (serverFields.length > 0) {
			sections.push(`\tserver: {\n${serverFields.join("\n")}\n\t}`);
		}
		if (clientFields.length > 0) {
			sections.push(`\tclient: {\n${clientFields.join("\n")}\n\t}`);
		}
		if (sharedFields.length > 0) {
			sections.push(`\tshared: {\n${sharedFields.join("\n")}\n\t}`);
		}
		sections.push(`\truntimeEnv: {\n${runtimeEnvFields.join("\n")}\n\t}`);

		return `import arkenv from "@arkenv/nextjs";
import { z } from "zod";

/**
 * Environment variable schema.
 * In Next.js, use \`@arkenv/nextjs\` to validate variables at build-time and runtime.
 * Enforces client/server separation and prevents secret leaks.
 */
export const env = arkenv({
${sections.join(",\n")},
});
`;
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
