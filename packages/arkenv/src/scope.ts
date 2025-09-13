import { scope, type } from "arktype";
import { boolean, host, port } from "./types";

// For an explanation of the `$` variable naming convention, see: https://discord.com/channels/957797212103016458/1414659167008063588/1414670282756587581

/**
 * The root scope for the ArkEnv library, containing extensions to the ArkType scopes with ArkEnv-specific types like `string.host` and `number.port`.
 */
export const $ = scope({
	boolean,
	string: type.module({
		...type.keywords.string,
		host,
		boolean,
	}),
	number: type.module({
		...type.keywords.number,
		port,
	}),
});
