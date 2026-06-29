import { createEnv } from "@arkenv/nuxt";

export const env = createEnv({
	server: {
		DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
	},
	client: {
		NUXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
	},
	shared: {
		NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	},
});
