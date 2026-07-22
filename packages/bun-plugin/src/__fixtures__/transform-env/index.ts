import { env } from "./env";

export const config = {
	apiUrl: env.BUN_PUBLIC_API_URL,
	debug: env.BUN_PUBLIC_DEBUG,
	port: env.BUN_PUBLIC_PORT,
	nodeEnv: env.NODE_ENV,
};

/**
 * Read a server-only key (throws in the transformed client module).
 *
 * @returns The database URL from the env object
 */
export function readServerSecret() {
	return env.DATABASE_URL;
}
