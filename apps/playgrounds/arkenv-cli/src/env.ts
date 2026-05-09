import arkenv, { type } from "arkenv";

const Env = type({
	NODE_ENV: "'development' | 'production' | 'test'",
	PORT: "number.port",
});

/**
 * ArkEnv handles environment variable validation and type-safety.
 * For Vite, ensure you add the @arkenv/vite-plugin to your vite.config.ts.
 */
export const env = arkenv(Env);
