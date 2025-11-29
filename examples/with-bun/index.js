import arkenv from "arkenv";

const env = arkenv({
	HOST: "string.host",
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});

const host = env.HOST;
const port = env.PORT;
const nodeEnv = env.NODE_ENV;

console.log({ host, port, nodeEnv });

export default env;
