import arkenv from "@arkenv/nextjs/client";
import { SharedEnv } from "./shared";

export const env = arkenv(
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
