import { env } from "./env";

export const config = {
	apiUrl: env.VITE_API_URL,
	debug: env.VITE_DEBUG,
	port: env.VITE_PORT,
	nodeEnv: env.NODE_ENV,
};

export function readServerSecret() {
	return env.DATABASE_URL;
}
