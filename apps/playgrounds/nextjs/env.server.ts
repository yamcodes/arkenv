import { createEnv } from "@arkenv/nextjs/server";
import { env as clientEnv } from "./env.client";

export const env = createEnv(
	{
		DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
	},
	{
		extends: [clientEnv],
	},
);
