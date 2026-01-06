import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

import type { type as at } from "arktype";

/**
 * `type` is a typesafe environment variable validator, an alias for `arktype`'s `type`.
 */
export const type: typeof at = new Proxy((() => {}) as unknown as typeof at, {
	get(_, prop) {
		const { $ } = require("@repo/scope");
		return Reflect.get($.type, prop);
	},
	apply(_, thisArg, args) {
		const { $ } = require("@repo/scope");
		return Reflect.apply($.type, thisArg === type ? $.type : thisArg, args);
	},
});
export type { type as at } from "arktype";
