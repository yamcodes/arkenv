import arkenv, { type } from "arkenv";

const Env = type({
	HOST: "string.host",
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	DEBUG: "boolean = true",
	RANGEPORT: "0 <= number.integer <= 65535",
});

console.log(JSON.stringify(Env.toJsonSchema(), null, 2));
console.log("----");
console.log(JSON.stringify(Env.toJSON(), null, 2));

const env = arkenv(Env);

// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
console.log({
	host: env.HOST,
	port: env.PORT,
	nodeEnv: env.NODE_ENV,
	debug: env.DEBUG,
});

export default env;
