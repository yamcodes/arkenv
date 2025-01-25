import { type } from "arktype";
import { defineEnv } from "..";

const User = type({
	name: "string",
	age: "number",
	friends: "string[]",
});
export type User = typeof User.infer;

const myEnv = defineEnv({
	HELLO: "string",
});

console.log(myEnv);
