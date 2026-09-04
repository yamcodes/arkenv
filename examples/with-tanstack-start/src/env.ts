import arkenv from "@arkenv/core";

/**
 * Validated environment for this app.
 */
export const env = arkenv({
	DATABASE_URL: "string = 'postgres://localhost:5432/tanstackstart'",
	VITE_APP_NAME: "string = 'ArkEnv + TanStack Start'",
	VITE_APP_RELEASE: "string = 'local'",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
