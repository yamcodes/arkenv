import { env } from "~~/env/server";

export default defineEventHandler(() => {
	return {
		DATABASE_URL: env.DATABASE_URL,
		NUXT_PUBLIC_API_URL: env.NUXT_PUBLIC_API_URL,
		NODE_ENV: env.NODE_ENV,
	};
});
