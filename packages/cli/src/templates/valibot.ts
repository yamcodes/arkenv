import dedent from "dedent";

/**
 * Generates a TypeScript template string for a Valibot environment configuration.
 *
 * @param envKeys - Optional array of environment variable keys to include in the schema.
 * @param framework - The framework being used (vite, bun, or node).
 * @returns The generated TypeScript template string.
 */
export const valibotTemplate = (envKeys?: string[], framework?: string) => {
	const schemaFields = envKeys?.length
		? envKeys.map((key) => `\t\t${key}: v.string(),`).join("\n")
		: `\t\tNODE_ENV: v.picklist(["development", "production", "test"]),
PORT: v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(65535)),`;

	if (framework === "vite") {
		return dedent /* ts */`
	import * as v from "valibot";

	/**
	 * Environment variable schema.
	 * In Vite, use \`@arkenv/vite-plugin\` to validate these at build-time
	 * and provide typesafety for \`import.meta.env\`.
	 */
	export const Env = v.object({
${schemaFields}
	});
	`;
	}

	if (framework === "bun") {
		return dedent /* ts */`
	import * as v from "valibot";

	/**
	 * Environment variable schema.
	 * In Bun, use \`@arkenv/bun-plugin\` to validate these at build-time
	 * and provide typesafety for \`process.env\`.
	 */
	export const Env = v.object({
${schemaFields}
	});
	`;
	}

	return dedent /* ts */`
	import arkenv from "arkenv/standard";
	import * as v from "valibot";

	export const Env = v.object({
${schemaFields}
	});

	export const env = arkenv(Env);
`;
};
