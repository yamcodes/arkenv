import { $ } from "@repo/scope";

/**
 * `type` is a typesafe environment variable validator, an alias for `arktype`'s `type`.
 * It includes arkenv-specific keywords like `string.host` and `number.port`.
 */
export const type: typeof $.type = new Proxy((() => {}) as any, {
	get(_, prop) {
		if (prop === "isArktype") return true;
		return Reflect.get($.type, prop);
	},
	apply(_, thisArg, args) {
		const result = Reflect.apply(
			$.type,
			thisArg === type ? $.type : thisArg,
			args,
		);
		// If the result is a function/object, ensure it also has the marker
		if (
			result &&
			(typeof result === "object" || typeof result === "function")
		) {
			(result as any).isArktype = true;
		}
		return result;
	},
});

export type { type as at } from "arktype";
