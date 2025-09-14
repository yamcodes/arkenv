import arkenv from "arkenv";

const env = arkenv({
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	HOST: "string.host",
	PORT: "number.port",
});

// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
console.log(env.HOST); // (property) HOST: string
console.log(env.PORT); // (property) PORT: number
console.log(env.NODE_ENV); // (property) NODE_ENV: "development" | "production" | "test"

export default env;
