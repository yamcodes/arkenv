import { createEnv } from "./create-env.ts";
import { ArkEnvError } from "./errors.ts";

export type { EnvSchema } from "./create-env.ts";

const arkenv = createEnv;

// CJS interop: ensure require("arkenv") returns the function directly
// TODO: Move this to a separate index.cjs.ts entry once tsdown format-specific entries are working
if (typeof module !== "undefined" && "exports" in module) {
	Object.assign(arkenv, {
		default: arkenv,
		createEnv,
		ArkEnvError,
	});
	module.exports = arkenv;
}

export { arkenv, createEnv, ArkEnvError };
export default arkenv;
