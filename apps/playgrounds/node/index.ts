import arkenv, { type } from "arkenv";
import * as z from "zod";

const env = arkenv({
	HOST: "string.host",
	MY_STRING_AS_NUMBER: "number",
	MY_STRING_AS_NUMBER_2: type("number"),
	MY_EPOCH: "number.epoch",
	MY_EPOCH_2: type("number.epoch"),
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	ALLOWED_ORIGINS: type("string[]").default(() => []),
	DEBUG: "boolean = true",
	ZED_ENV: z.string(),
});

// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
console.log({
	host: env.HOST,
	port: env.PORT,
	nodeEnv: env.NODE_ENV,
	allowedOrigins: env.ALLOWED_ORIGINS,
	debug: env.DEBUG,
	myString: env.MY_STRING_AS_NUMBER,
	myString2: env.MY_STRING_AS_NUMBER_2,
	zedEnv: env.ZED_ENV,
	myEpoch: env.MY_EPOCH,
	myEpoch2: env.MY_EPOCH_2,
});

export default env;
