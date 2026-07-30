import arkenv from "@arkenv/core";

export const env = arkenv({
	DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
	BUN_PUBLIC_API_URL: "string = 'https://api.example.com'",
	BUN_PUBLIC_DEBUG: "boolean = false",
	BUN_PUBLIC_PORT: "number = 3000",
	NODE_ENV: "'development' | 'production' | 'test' = 'test'",
});

export default env;
