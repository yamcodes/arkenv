import arkenv from "@arkenv/core";

/** Validated environment for this app. */
export const env = arkenv({
	DATABASE_URL: "string = 'postgres://localhost:5432/solidstart'",
	VITE_TEST: "string = 'Hello from SolidStart'",
	VITE_NUMERIC: "string.numeric = '42'",
	VITE_BOOLEAN: "boolean = true",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
