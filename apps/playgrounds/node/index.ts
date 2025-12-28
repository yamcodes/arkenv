import arkenv from "arkenv";

export const env = arkenv({
	// Custom string literals
	NODE_ENV: "string",
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
