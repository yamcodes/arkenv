import arkenv from "./generated/env.gen";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	{
		NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
	},
	{
		extends: [SharedSchema],
	},
);
