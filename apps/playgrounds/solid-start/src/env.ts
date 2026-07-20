import arkenv from "@arkenv/core";

/**
 * Canonical env object for the SolidStart example.
 * Client (`VITE_*`) keys are inlined by `@arkenv/vite-plugin` in the browser graph;
 * server-only keys validate at boot in the SSR graph.
 */
export const env = arkenv({
	DATABASE_URL: "string = 'postgres://localhost:5432/solidstart'",
	VITE_TEST: "string = 'Hello from SolidStart'",
	VITE_NUMERIC: "string.numeric = '42'",
	VITE_BOOLEAN: "boolean = true",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
