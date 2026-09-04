import arkenv from "@arkenv/core";

/**
 * Validated environment for this app.
 */
export const env = arkenv({
	DATABASE_URL: "string = 'postgres://localhost:5432/tanstackstart'",
	PORT: "number.port = 3000",
	VITE_API_URL: "string = 'https://api.example.com'",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
