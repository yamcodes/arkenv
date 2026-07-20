import arkenv from "@arkenv/nuxt/client";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	{
		NUXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
	},
	{
		extends: [SharedSchema],
	},
);
