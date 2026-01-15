import type { type as at } from "arktype";
import { loadArkTypeOrThrow } from "./utils/arktype";

/**
 * A lazy proxy for ArkType's `type` function, bound to ArkEnv's custom scope.
 * This allows using custom keywords like `number.port` and `string.host`
 * while ensuring ArkType is only loaded when needed.
 */
export const type = new Proxy(() => {}, {
	get(_target, prop) {
		const { $ } = loadArkTypeOrThrow();
		return ($ as any).type[prop];
	},
	apply(_target, _thisArg, argArray) {
		const { $ } = loadArkTypeOrThrow();
		return ($ as any).type(...argArray);
	},
}) as unknown as typeof at;
