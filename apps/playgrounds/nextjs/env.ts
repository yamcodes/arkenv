import arkenv from "@arkenv/nextjs";

export const env = arkenv({
	server: {
		DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
	},
	client: {
		NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
	},
	shared: {
		NODE_ENV: "string = 'development'",
	},
	runtimeEnv: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		NODE_ENV: process.env.NODE_ENV,
	},
});
