import { host, port } from "@repo/keywords";
import { scope, type } from "arktype";

/**
 * The root scope for the ArkEnv library.
 * keywords are kept as standard types to support parsing refinements like 'number >= 18'.
 * Coercion is applied globally in createEnv via a schema transformer.
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
	boolean: type.keywords.boolean,
});

export type $ = (typeof $)["t"];
