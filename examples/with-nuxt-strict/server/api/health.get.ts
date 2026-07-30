import { env } from "~~/env/server";

export default defineEventHandler(() => ({
	status: "ok",
	environment: env.NODE_ENV,
	databaseConfigured: Boolean(env.DATABASE_URL),
}));
