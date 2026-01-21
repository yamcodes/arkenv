import arkenv, { createEnv, ArkEnvError } from "./index.ts";

Object.assign(arkenv, {
	default: arkenv,
	createEnv,
	ArkEnvError,
});

export default arkenv;
