import arkenv, { type } from "arkenv";

const env = arkenv({
	HOST: "string.host",
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	ALLOWED_ORIGINS: type("string[]").default(() => []),
	DEBUG: "boolean = true",
});

console.log("Hello via Bun!");