import arkenv from "arkenv";

export const env = arkenv({
	HOST: "string",
	PORT: "number",
	NODE_ENV: "string",
	DEBUGGING: "boolean",
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
