/**
 * Nitro fixture for strict-layout auto-extend.
 *
 * Imports `~~/env/server` so the playground build exercises the Nitro alias /
 * `__ARKENV_STRICT_LAYOUT__` wiring (Vite alone is not enough).
 */
import { env } from "~~/env/server";

export default defineEventHandler(() => {
	return {
		DATABASE_URL: env.DATABASE_URL,
		NUXT_PUBLIC_API_URL: env.NUXT_PUBLIC_API_URL,
		NODE_ENV: env.NODE_ENV,
	};
});
