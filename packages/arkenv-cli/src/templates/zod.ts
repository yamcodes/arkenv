import dedent from "dedent";

/**
 * Generates a TypeScript template string for a Zod environment configuration.
 *
 * @param frameworkNote - Framework-specific notes or comments to include in the template.
 * @returns The generated TypeScript template string.
 */
export const zodTemplate = (frameworkNote: string) => dedent /* ts */`
	import arkenv from "arkenv/standard";
	import { z } from "zod";

	const Env = z.object({
		NODE_ENV: z.enum(["development", "production", "test"]),
		PORT: z.coerce.number().positive(),
	});

	/**
	 * ArkEnv handles environment variable validation and type-safety.
	 * ${frameworkNote}
	 */
	export const env = arkenv(Env);
`;
