import arkenv from "@arkenv/core";

export const env = arkenv({
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	HOST: "string.host = '127.0.0.1'",
	PORT: "number.port = 5001",
	GITHUB_TOKEN: "string | undefined",
});
