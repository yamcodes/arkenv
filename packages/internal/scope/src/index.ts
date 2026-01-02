import {
	booleanArray,
	host,
	jsonArray,
	mixedArray,
	numberArray,
	port,
	stringArray,
} from "@repo/keywords";
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
		array: type.module({
			root: stringArray,
			json: jsonArray,
		}),
	}),
	number: type.module({
		...type.keywords.number,
		port,
		array: numberArray,
	}),
	// boolean is not a module in ArkType, so we wrap it
	boolean: type.module({
		root: type.keywords.boolean,
		array: booleanArray,
	}),
	mixedArray,
	// Alias mixedArray to just 'array' for convenience if desired, or keep specific
});

export type $ = (typeof $)["t"];
