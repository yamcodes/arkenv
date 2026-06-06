// This mimics the paths used by twoslash
import { type } from "../../packages/nextjs/src/shared";
export const SharedSchema = type({
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});

import arkenvClient from "../../packages/nextjs/src/client";
export const clientEnv = arkenvClient(
	{ NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'" },
	{
		extends: [SharedSchema],
		runtimeEnv: {
			NEXT_PUBLIC_API_URL: "https://api.example.com",
			NODE_ENV: "development",
		},
	},
);

import arkenvServer from "../../packages/nextjs/src/server";
export const serverEnv = arkenvServer(
	{ DATABASE_URL: "string" },
	{ extends: [clientEnv] },
);
