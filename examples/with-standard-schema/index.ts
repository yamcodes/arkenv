import arkenv from "arkenv";
import { type } from "arktype";
import * as z from "zod";

const env = arkenv({
	TEST: type("string"),
});

// // All validators work together seamlessly with full type inference
// console.log({
// 	host: env.HOST,
// 	port: env.PORT,
// 	nodeEnv: env.NODE_ENV,
// 	debug: env.DEBUG,
// 	databaseUrl: env.DATABASE_URL,
// 	apiKey: `${env.API_KEY.substring(0, 8)}...`, // Don't log full API key
// });

export default env;
