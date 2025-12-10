import arkenv, { type } from "arkenv";
import * as z from "zod";

const env = arkenv({
	HOST: "string.host",
	MY_STRING_AS_NUMBER: type("string").pipe((value) => Number(value)),
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	ALLOWED_ORIGINS: type("string[]").default(() => []),
	DEBUG: "boolean = true",
	ZED_ENV: z.string(),
});

// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
const host = env.HOST;
const port = env.PORT;
const nodeEnv = env.NODE_ENV;
const allowedOrigins = env.ALLOWED_ORIGINS;
const debug = env.DEBUG;
const zedEnv = env.ZED_ENV;
console.log({
	host,
	port,
	nodeEnv,
	allowedOrigins,
	debug,
	myString: env.MY_STRING_AS_NUMBER,
	zedEnv,
});

export default env;
