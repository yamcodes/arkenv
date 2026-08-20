import { type } from "@arkenv/core";

export const Env = type({
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	HOST: "string.host = '127.0.0.1'",
	PORT: "number.port = 5001",
	GITHUB_TOKEN: "string | undefined",
});
