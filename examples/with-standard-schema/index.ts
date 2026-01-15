import arkenv from "arkenv";
import { z } from "zod";

const env = arkenv(
	{
		// Using custom keywords from the bundled scope
		HOST: "string.host",
		PORT: "0 <= number.integer <= 65535",
		NODE_ENV: "'development' | 'production' | 'test' = 'development'",
		DEBUG: "boolean = false",
	},
	{
		validator: "standard",
	},
);

// const env = arkenv({
// 	// Using custom keywords from the bundled scope
// 	HOST: z.union([z.url(), z.literal("localhost")]),
// 	PORT: z.coerce.number().int().min(0).max(65535),
// 	NODE_ENV: z
// 		.enum(["development", "production", "test"])
// 		.default("development"),
// 	DEBUG: z.coerce.boolean().default(false),
// });

console.log({
	host: env.HOST,
	port: env.PORT,
	nodeEnv: env.NODE_ENV,
	debug: env.DEBUG,
});

export default env;
