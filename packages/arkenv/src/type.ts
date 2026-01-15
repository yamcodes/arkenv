import { loadArkTypeOrThrow } from "./utils/arktype";

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
		const { $ } = loadArkTypeOrThrow();
		return ($.type as any)[prop];
	},
	apply(_target, _thisArg, argArray) {
		const { $ } = loadArkTypeOrThrow();
		return ($.type as any)(...argArray);
	},
}) as any; // Type as 'any' since we can't import the actual type without loading arktype
