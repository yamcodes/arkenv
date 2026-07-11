import arkenv from "@arkenv/nuxt";

export const env = arkenv({
	DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
	NUXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
