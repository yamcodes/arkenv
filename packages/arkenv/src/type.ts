import { $ } from "@repo/scope";

/**
 * Create type-safe environment variable validators using ArkType's syntax.
 *
 * This is a re-export of ArkType's `type` function with arkenv-specific keywords added:
 * - `string.host` - Validates hostnames and IP addresses
 * - `number.port` - Validates port numbers (0-65535)
 *
 * The proxy wrapper ensures that created types are properly marked as ArkType instances
 * for internal detection and handling.
 *
 * @example
 * ```ts
 * // Create a simple type
 * const Port = type("number.port");
 *
 * // Create an object schema
 * const Config = type({
 *   HOST: "string.host",
 *   PORT: "number.port",
 *   DEBUG: "boolean"
 * });
 *
 * // Use with createEnv
 * const env = createEnv(Config);
 * ```
 *
 * @see {@link https://arktype.io/docs | ArkType Documentation}
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
