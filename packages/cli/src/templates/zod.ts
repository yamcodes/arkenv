import dedent from "dedent";

/**
 * Generates a TypeScript template string for a Zod environment configuration.
 *
 * @param frameworkNote - Framework-specific notes or comments to include in the template.
 * @param envKeys - Optional array of environment variable keys to include in the schema.
 * @returns The generated TypeScript template string.
 */
export const zodTemplate = (frameworkNote: string, envKeys?: string[]) => {
	const schemaFields = envKeys?.length
		? envKeys.map((key) => `\t\t${key}: z.string(),`).join("\n")
		: `\t\tNODE_ENV: z.enum(["development", "production", "test"]),
		PORT: z.coerce.number().positive(),`;

	return dedent /* ts */`
	import arkenv from "arkenv/standard";
	import { z } from "zod";

	const Env = z.object({
${schemaFields}
	});

	/**
	 * ArkEnv handles environment variable validation and type-safety.
	 * ${frameworkNote}
	 */
	export const env = arkenv(Env);
`;
};
