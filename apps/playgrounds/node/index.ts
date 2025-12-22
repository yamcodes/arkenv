import arkenv from "arkenv";

const env = arkenv({
	HOST: "string.ip | 'localhost'",
	PORT: "0 <= number.integer <= 65535",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	DEBUG: "boolean = true",
});

// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
console.log({
	host: env.HOST,
	port: env.PORT,
	nodeEnv: env.NODE_ENV,
	debug: env.DEBUG,
});

export default env;
