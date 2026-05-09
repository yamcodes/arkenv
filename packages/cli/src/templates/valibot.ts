import dedent from "dedent";

/**
 * Generates a TypeScript template string for a Valibot environment configuration.
 *
 * @param envKeys - Optional array of environment variable keys to include in the schema.
 * @returns The generated TypeScript template string.
 */
export const valibotTemplate = (envKeys?: string[]) => {
	const schemaFields = envKeys?.length
		? envKeys.map((key) => `\t\t${key}: v.string(),`).join("\n")
		: `\t\tNODE_ENV: v.picklist(["development", "production", "test"]),
		PORT: v.pipe(v.string(), v.transform(Number), v.number(), v.minValue(1)),`;

	return dedent /* ts */`
	import arkenv from "arkenv/standard";
	import * as v from "valibot";

	const Env = v.object({
${schemaFields}
	});

	export const env = arkenv(Env);
`;
};
