import arkenv, { type } from "arkenv";

const Env = type({
	HOST: "string.host",
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	ALLOWED_ORIGINS: type("string[]").default(() => []),
	DEBUG: "boolean = true",
});

const env = arkenv(Env, process.env);

// Automatically validate and parse process.env
// Values are validated and parsed at runtime!
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
