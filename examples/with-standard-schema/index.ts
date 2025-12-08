import arkenv, { type } from "arkenv";
import { z } from "zod";

const env = arkenv({
	// ArkType validators (concise TypeScript-like syntax)
	HOST: "string.host",
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	DEBUG: "boolean = false",

	// Zod validators (great for complex validation and transformations)
	DATABASE_URL: z.string().url(),
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
		.transform((str) => str.split(","))
		.pipe(z.array(z.string().url())),

	// Array defaults with ArkType
	FEATURE_FLAGS: type("string[]").default(() => []),
});

// All validators work together seamlessly with full type inference
const host: string = env.HOST;
const port: number = env.PORT;
const nodeEnv: "development" | "production" | "test" = env.NODE_ENV;
const debug: boolean = env.DEBUG;
const databaseUrl: string = env.DATABASE_URL;
const apiKey: string = env.API_KEY;
const maxRetries: number = env.MAX_RETRIES;
const timeoutMs: number = env.TIMEOUT_MS;
const allowedOrigins: string[] = env.ALLOWED_ORIGINS;
const featureFlags: string[] = env.FEATURE_FLAGS;

console.log({
	host,
	port,
	nodeEnv,
	debug,
	databaseUrl,
	apiKey: `${apiKey.substring(0, 8)}...`, // Don't log full API key
	maxRetries,
	timeoutMs,
	allowedOrigins,
	featureFlags,
});

export default env;
