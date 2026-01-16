import type { $ } from "@repo/scope";
import { loadArkTypeValidator } from "./utils/load-arktype.ts";

/**
 * Lazy proxy for ArkType's `type` function, bound to ArkEnv's custom scope.
 * Use this to create types with custom keywords like `number.port` and `string.host`.
 *
 * @example
 * ```ts
 * const schema = type({ PORT: "number.port", HOST: "string.host" });
 * ```
 */
export const type = new Proxy(() => {}, {
	get(_target, prop) {
		const validator = loadArkTypeValidator();
		return validator.type[prop];
	},
	apply(_target, _thisArg, argArray) {
		const validator = loadArkTypeValidator();
		return validator.type(...argArray);
	},
}) as unknown as typeof $.type;
