import arkenv from "arkenv";

const env = arkenv({
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	HOST: "string.host",
	PORT: "number.port",
});

// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
const host = env.HOST;
const port = env.PORT;
const nodeEnv = env.NODE_ENV;

console.log({ host, port, nodeEnv });

export default env;
