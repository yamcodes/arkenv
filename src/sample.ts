import { type } from "arktype";
import { defineEnv, host, port } from "..";

const User = type({
	name: "string",
	age: "number",
	friends: "string[]",
});
export type User = typeof User.infer;

const env = defineEnv({
	HOST: host,
	PORT: port,
	NODE_ENV: "'development' | 'production' | 'test'",
});
console.log(env.HOST, env.PORT, env.NODE_ENV);

console.log(`${env.HOST}:${env.PORT} in ${env.NODE_ENV}`);
