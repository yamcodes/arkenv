import arkenv, { type } from "arkenv";
import { z } from "zod";

const env = arkenv({
	// ArkType validators (concise TypeScript-like syntax)
	HOST: "string.host",
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	DEBUG: "boolean = false",

	// Zod validators (great for complex validation and transformations)
	DATABASE_URL: z.url(),
	API_KEY: z
		.string()
		.min(32)
		.describe("API key must be at least 32 characters"),

	// Mix them together based on your needs
	MAX_RETRIES: z.number().int().positive().default(3),
	TIMEOUT_MS: z.number().int().min(0).max(30000).default(5000),

	// Complex transformations with Zod
	ALLOWED_ORIGINS: z
		.string()
		.transform((str: string) => str.split(","))
		.pipe(z.array(z.url())),

	// Array defaults with ArkType
	FEATURE_FLAGS: type("string[]").default(() => []),
});

// All validators work together seamlessly with full type inference
console.log({
	host: env.HOST,
	port: env.PORT,
	nodeEnv: env.NODE_ENV,
	debug: env.DEBUG,
	databaseUrl: env.DATABASE_URL,
	apiKey: `${env.API_KEY.substring(0, 8)}...`, // Don't log full API key
	maxRetries: env.MAX_RETRIES,
	timeoutMs: env.TIMEOUT_MS,
	allowedOrigins: env.ALLOWED_ORIGINS,
	featureFlags: env.FEATURE_FLAGS,
});

export default env;
