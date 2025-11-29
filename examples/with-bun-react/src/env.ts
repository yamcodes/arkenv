import arkenv, { type } from "arkenv";

const Env = type({
	PORT: "number.port",
	BUN_PUBLIC_TEST: "string",
});

export const env = arkenv(Env);

export default Env;
