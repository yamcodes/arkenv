import { type Scope, scope, type } from "arktype";
import { host, port } from "./keywords";

const rawScope = scope({
	string: type.module({
		...type.keywords.string,
		host,
	}),
	number: type.module({
		...type.keywords.number,
		port,
	}),
});

export type $ = (typeof rawScope)["t"];

/**
 * The root scope for the ArkEnv library,
 * containing extensions to the ArkType scopes with ArkEnv-specific types
 * like `string.host` and `number.port`.
 */
export const $: Scope<$> = rawScope as never;
