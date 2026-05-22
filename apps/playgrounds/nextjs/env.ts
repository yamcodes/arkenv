import arkenv from "@arkenv/nextjs";

export const env = arkenv({
	server: {
		DATABASE_URL: "string",
	},
	client: {
		NEXT_PUBLIC_API_URL: "string",
	},
	shared: {
		NODE_ENV: "string",
	},
	runtimeEnv: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		NODE_ENV: process.env.NODE_ENV,
	},
});
