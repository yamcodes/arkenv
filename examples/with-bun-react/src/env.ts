import arkenv from "@arkenv/core";

/**
 * Canonical env object for the Bun + React example.
 * Client (`BUN_PUBLIC_*`) keys are inlined by `@arkenv/bun-plugin` in browser bundles;
 * server-only keys validate at boot when `env.ts` is imported from `Bun.serve` code.
 */
export const env = arkenv({
	DATABASE_URL: "string = 'postgres://localhost:5432/bun-react'",
	BUN_PUBLIC_API_URL: "string.url = 'https://api.example.com'",
	BUN_PUBLIC_DEBUG: "boolean = true",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
