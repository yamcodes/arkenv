import { type } from "arktype";
import { defineEnv } from "..";

const User = type({
	name: "string",
	age: "number",
	friends: "string[]",
});
export type User = typeof User.infer;

const { HOST } = defineEnv({
	HOST: "string.ip",
});

console.log(HOST);
