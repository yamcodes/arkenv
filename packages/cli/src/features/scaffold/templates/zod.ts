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
