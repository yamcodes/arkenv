import arkenv from "#arkenv/env";

export const env = arkenv({
	DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
	NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
	NEXT_PUBLIC_ENABLE_BETA_FEATURE: "boolean = false",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});

export type Env = typeof env;
