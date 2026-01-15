import arkenv, { type } from "arkenv";
import * as z from "zod";

const env = arkenv(
	{
		// Zod validators (great for complex validation and transformations)
		DATABASE_URL: z.string().url(),
		API_KEY: z
			.string()
			.min(32)
			.describe("API key must be at least 32 characters"),

		// Standard Schema compatible validators
		MAX_RETRIES: z.number().int().positive().default(3),
		TIMEOUT_MS: z.number().int().min(0).max(30000).default(5000),

		// Complex transformations with Zod
		ALLOWED_ORIGINS: z
			.string()
			.transform((str: string) => str.split(","))
			.pipe(z.array(z.string().url())),

		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		DEBUG: z.boolean().default(false),
	},
	{ validator: "standard" },
);

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
