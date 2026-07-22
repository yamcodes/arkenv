import arkenv from "@arkenv/core";

/** Validated environment for this app. */
export const env = arkenv({
	DATABASE_URL: "string = 'postgres://localhost:5432/bun-react'",
	BUN_PUBLIC_API_URL: "string.url = 'https://api.example.com'",
	BUN_PUBLIC_DEBUG: "boolean = true",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
