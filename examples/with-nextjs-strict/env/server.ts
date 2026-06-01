import arkenv from "@arkenv/nextjs/server";
import { env as clientEnv } from "./client";

export const env = arkenv(
	{
		DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
	},
	{
		extends: [clientEnv],
	},
);
