import { scope, type } from "arktype";
import { host, port } from "./keywords";

/**
 * Definition of the scope for type inference purposes only.
 * This file is never imported at runtime to keep arktype optional.
 */
const $ = scope({
	string: type.module({
		...type.keywords.string,
		host,
	}),
	number: type.module({
		...type.keywords.number,
		port,
	}),
});

export type ArkEnvScope = typeof $;
