import { createEnv } from "@arkenv/nextjs/client";
import { SharedEnv } from "./env.shared";

export const env = createEnv(
	{
		NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
	},
	{
		extends: [SharedEnv],
		runtimeEnv: {
			NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
			NODE_ENV: process.env.NODE_ENV,
		},
	},
);
