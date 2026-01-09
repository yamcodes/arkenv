import { $ } from "@repo/scope";

/**
 * `type` is a typesafe environment variable validator, an alias for `arktype`'s `type`.
 * It includes arkenv-specific keywords like `string.host` and `number.port`.
 */
export const type: typeof $.type = new Proxy((() => {}) as any, {
	get(_, prop) {
		return Reflect.get($.type, prop);
	},
	apply(_, thisArg, args) {
		return Reflect.apply($.type, thisArg === type ? $.type : thisArg, args);
	},
});

export type { type as at } from "arktype";
