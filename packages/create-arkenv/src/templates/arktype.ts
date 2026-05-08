export const arktypeTemplate = (frameworkNote: string) => `import arkenv, { type } from "arkenv";

const Env = type({
	NODE_ENV: "'development' | 'production' | 'test'",
	PORT: "number.port",
});

/**
 * ArkEnv handles environment variable validation and type-safety.
 * \${frameworkNote}
 */
export const env = arkenv(Env);
`;
