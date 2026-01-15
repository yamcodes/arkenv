import { loadArkTypeOrThrow } from "./utils/arktype";

/**
 * A lazy proxy for ArkType's `type` function, bound to ArkEnv's custom scope.
 * This allows using custom keywords like `number.port` and `string.host`
 * while ensuring ArkType is only loaded when needed.
 */
export const type = new Proxy(() => {}, {
	get(_target, prop) {
		const { $ } = loadArkTypeOrThrow();
		return ($.type as any)[prop];
	},
	apply(_target, _thisArg, argArray) {
		const { $ } = loadArkTypeOrThrow();
		return ($.type as any)(...argArray);
	},
}) as any;
