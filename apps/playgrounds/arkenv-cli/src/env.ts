import arkenv, { type } from "arkenv";

const Env = type({
	NODE_ENV: "'development' | 'production' | 'test'",
	PORT: "number.port",
});

export const env = arkenv(Env);
