import dedent from "dedent";

/**
 * Generates a TypeScript template string for an ArkType environment configuration.
 *
 * @param  frameworkNote - Framework-specific notes or comments to include in the template.
 * @returns The generated TypeScript template string.
 */
export const arktypeTemplate = (frameworkNote: string) => dedent /* ts */`
	import arkenv, { type } from "arkenv";

	const Env = type({
		NODE_ENV: "'development' | 'production' | 'test'",
		PORT: "number.port",
	});

	/**
	 * ArkEnv handles environment variable validation and type-safety.
	 * ${frameworkNote}
	 */
	export const env = arkenv(Env);
`;
