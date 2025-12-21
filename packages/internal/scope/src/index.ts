import { host, port } from "@repo/keywords";
import { scope, type } from "arktype";

/**
 * The root scope for the ArkEnv library,
 * containing extensions to the ArkType scopes with ArkEnv-specific types
 * like `string.host` and `number.port`.
 */
export const $ = scope({
	string: type.module({
		...type.keywords.string,
		host,
	}),
	number: type.module({
		...type.keywords.number,
		port,
	}),
});

export type $ = (typeof $)["t"];
