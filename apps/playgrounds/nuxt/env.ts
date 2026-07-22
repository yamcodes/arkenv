import arkenv from "@arkenv/nuxt";

export const env = arkenv({
	DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
	NUXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
	NUXT_PUBLIC_PORT: "number = 3000",
	NUXT_PUBLIC_FEATURE_FLAG: "boolean = false",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
