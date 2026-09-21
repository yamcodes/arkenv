import arkenv from "@arkenv/core";

const env = arkenv({
	HOST: "string.host = 'localhost'",
	PORT: "number.port = 3000",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	DEBUGGING: "boolean = false",
});

// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
console.log({
	host: env.HOST,
	port: env.PORT,
	nodeEnv: env.NODE_ENV,
	debugging: env.DEBUGGING,
});

export default env;
