import arkenv from "@arkenv/nextjs/client";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	{
		NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
	},
	{
		extends: [SharedSchema],
		runtimeEnv: {
			NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
			NODE_ENV: process.env.NODE_ENV,
		},
	},
);
