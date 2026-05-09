import dedent from "dedent";

/**
 * Generates a TypeScript template string for an ArkType environment configuration.
 *
 * @param envKeys - Optional array of environment variable keys to include in the schema.
 * @returns The generated TypeScript template string.
 */
export const arktypeTemplate = (envKeys?: string[]) => {
	const schemaFields = envKeys?.length
		? envKeys.map((key) => `\t\t${key}: "string",`).join("\n")
		: `\t\tNODE_ENV: "'development' | 'production' | 'test'",
		PORT: "number.port",`;

	return dedent /* ts */`
	import arkenv, { type } from "arkenv";

	const Env = type({
${schemaFields}
	});

	export const env = arkenv(Env);
`;
};
