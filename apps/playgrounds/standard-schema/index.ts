import arkenv from "arkenv/standard";
import * as z from "zod";

const env = arkenv({
	// Zod validators (great for complex validation and transformations)
	DATABASE_URL: z.url(),
	API_KEY: z
		.string()
		.min(32)
		.describe("API key must be at least 32 characters"),

	// Standard Schema compatible validators
	MAX_RETRIES: z.coerce.number().int().positive().default(3),
	TIMEOUT_MS: z.coerce.number().int().min(0).max(30000).default(5000),

	// Complex transformations with Zod
	ALLOWED_ORIGINS: z
		.string()
		.transform((str: string) => str.split(","))
		.pipe(z.array(z.url())),

	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	DEBUG: z
		.union([z.boolean(), z.enum(["true", "false", "1", "0"])])
		.transform((v) => v === true || v === "true" || v === "1")
		.default(false),
});

// All validators work together seamlessly with full type inference
console.log({
	nodeEnv: env.NODE_ENV,
	debug: env.DEBUG,
	databaseUrl: env.DATABASE_URL,
	apiKey: `${env.API_KEY.substring(0, 8)}...`, // Don't log full API key
	maxRetries: env.MAX_RETRIES,
	timeoutMs: env.TIMEOUT_MS,
	allowedOrigins: env.ALLOWED_ORIGINS,
});

export default env;
