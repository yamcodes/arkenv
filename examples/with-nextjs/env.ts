import { createEnv } from "./generated/env.gen";

export const env = createEnv({
	server: {
		DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
	},
	client: {
		NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
	},
	shared: {
		NODE_ENV: "string = 'development'",
	},
});
