import arkenv, { type } from "arkenv";

const env = arkenv({
	HOST: "string.host",
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	ALLOWED_ORIGINS: type("string[]").default(() => []),
	DEBUG: "boolean = true",
});

// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
const host = env.HOST;
const port = env.PORT;
const nodeEnv = env.NODE_ENV;
const allowedOrigins = env.ALLOWED_ORIGINS;
const debug = env.DEBUG;
console.log({
	host,
	port,
	nodeEnv,
	allowedOrigins,
	debug,
});

export default env;
