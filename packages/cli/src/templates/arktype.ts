import dedent from "dedent";

/**
 * Generates a TypeScript template string for an ArkType environment configuration.
 *
 * @param envKeys - Optional array of environment variable keys to include in the schema.
 * @param framework - The framework being used (vite, bun, or node).
 * @returns The generated TypeScript template string.
 */
export const arktypeTemplate = (envKeys?: string[], framework?: string) => {
	const schemaFields = envKeys?.length
		? envKeys.map((key) => `\t\t${key}: "string",`).join("\n")
		: `\t\tNODE_ENV: "'development' | 'production' | 'test'",
		PORT: "number.port",`;

	if (framework === "vite") {
		return dedent /* ts */`
		import { type } from "arkenv";

		/**
		 * Environment variable schema.
		 * In Vite, use \`@arkenv/vite-plugin\` to validate these at build-time
		 * and provide typesafety for \`import.meta.env\`.
		 */
		export const Env = type({
${schemaFields}
		});
		`;
	}

	if (framework === "bun") {
		return dedent /* ts */`
		import { type } from "arkenv";

		/**
		 * Environment variable schema.
		 * In Bun, use \`@arkenv/bun-plugin\` to validate these at build-time
		 * and provide typesafety for \`process.env\`.
		 */
		export const Env = type({
${schemaFields}
		});
		`;
	}

	return dedent /* ts */`
	import arkenv, { type } from "arkenv";

	export const Env = type({
${schemaFields}
	});

	export const env = arkenv(Env);
`;
};
