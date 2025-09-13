import arkenv from "arkenv";

const env = arkenv({
	HOST: "string.host",
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	// Both string.boolean and direct boolean work!
	SOME_FLAG: "boolean",
	DEBUG_MODE: "string.boolean",
});

// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
console.log(env.HOST); // (property) HOST: string
console.log(env.PORT); // (property) PORT: number
console.log(env.NODE_ENV); // (property) NODE_ENV: "development" | "production" | "test"
console.log(env.SOME_FLAG); // (property) SOME_FLAG: boolean
console.log(env.DEBUG_MODE); // (property) DEBUG_MODE: boolean

export default env;
