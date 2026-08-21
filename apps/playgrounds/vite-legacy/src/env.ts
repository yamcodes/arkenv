import arkenv from "@arkenv/core";

export const env = arkenv({
	PORT: "number.port",
	VITE_MY_VAR: "unknown",
	VITE_MY_NUMBER: "number",
	VITE_MY_BOOLEAN: "boolean",
});

export default env;
