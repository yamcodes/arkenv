import arkenv from "@arkenv/core";

/**
 * Validated environment for this app.
 */
export const env = arkenv({
	DATABASE_URL: "string = 'postgres://localhost:5432/tanstackstartrsbuild'",
	PORT: "number.port = 3000",
	PUBLIC_API_URL: "string = 'https://api.example.com'",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
