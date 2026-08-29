import arkenv from "@arkenv/core";
import * as v from "valibot";
import * as z from "zod";

export const env = arkenv({
	// ArkType DSL (compact TypeScript-like syntax)
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	PORT: "0 <= number.integer <= 65535 = 3000",

	// Valibot Standard Schema
	DATABASE_URL: v.pipe(v.string(), v.url()),

	// Zod Standard Schema
	DEBUG: z.boolean().default(false),
	API_KEY: z.string().min(32),
});

console.log({
	nodeEnv: env.NODE_ENV,
	port: env.PORT,
	databaseUrl: env.DATABASE_URL,
	debug: env.DEBUG,
	apiKey: `${env.API_KEY.substring(0, 8)}...`,
});

export default env;
