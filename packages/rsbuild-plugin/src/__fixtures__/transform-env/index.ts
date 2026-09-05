import { env } from "./env";

export const config = {
	apiUrl: env.PUBLIC_API_URL,
	debug: env.PUBLIC_DEBUG,
	port: env.PUBLIC_PORT,
	nodeEnv: env.NODE_ENV,
};

export function readServerSecret() {
	return env.DATABASE_URL;
}
