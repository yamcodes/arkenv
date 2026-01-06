import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

import type { $ } from "@repo/scope";

/**
 * `type` is a typesafe environment variable validator, an alias for `arktype`'s `type`.
 * It includes arkenv-specific keywords like `string.host` and `number.port`.
 */
export const type: typeof $.type = new Proxy((() => {}) as any, {
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
