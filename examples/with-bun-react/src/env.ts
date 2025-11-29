import arkenv, { type } from "arkenv";

const Env = type({
	PORT: "number.port",
	BUN_PUBLIC_TEST: "string",
	BUN_PUBLIC_BOOLEAN: "boolean",
});

export const env = arkenv(Env);

export default Env;
