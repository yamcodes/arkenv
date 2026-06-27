import arkenv, { type } from "@arkenv/core";

const Env = type({
	VITE_ONE: "string",
	VITE_TWO: "string",
	VITE_THREE: "string",
	VITE_HELLO: "string",
	VITE_TRUE: "string",
});

export const env = arkenv(Env);
