import arkenv from "arkenv";

export const env = arkenv(
	{
		BUN_PUBLIC_MY_VALUE: "string",
	},
	{
		prefix: "BUN_PUBLIC_",
	},
);
