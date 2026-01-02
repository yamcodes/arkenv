import arkenv from "arkenv";

const env = arkenv({
	HOST: "string.ip | 'localhost'",
	PORT: "0 <= number.integer <= 65535",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	DEBUGGING: "boolean = false",
	MY_ARRAY: "string[]",
	MY_MIXED_VALUE: "string | number",
});

// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
console.log({
	host: env.HOST,
	port: env.PORT,
	nodeEnv: env.NODE_ENV,
	debugging: env.DEBUGGING,
	myArray: env.MY_ARRAY,
	myMixedValue: env.MY_MIXED_VALUE,
});

export default env;
