import { type } from "arktype";
import { defineEnv, host, port } from "..";

const User = type({
	name: "string",
	age: "number",
	friends: "string[]",
});
export type User = typeof User.infer;

const { HOST, PORT } = defineEnv({
	HOST: host,
	PORT: port,
});

console.log(`${HOST}:${PORT}`);