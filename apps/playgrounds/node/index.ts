import arkenv from "arkenv";

const env = arkenv({
	HOST: "string.ip | 'localhost'",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	DEBUGGING: "boolean = false",
	PORT: "number",
});

// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
console.log({
	host: env.HOST,
	port: env.PORT,
	nodeEnv: env.NODE_ENV,
	debugging: env.DEBUGGING,
});

console.log(env.PORT);

export default env;
