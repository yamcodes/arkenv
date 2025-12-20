import { host, port } from "@repo/keywords";
import { Module, scope, type } from "arktype";

// For an explanation of the `$` variable naming convention, see: https://discord.com/channels/957797212103016458/1414659167008063588/1414670282756587581

/**
 * Coerces a string to a number.
 * If the input is already a number, it is returned as-is.
 * If the input is a string, it is converted to a number using `Number()`.
 */
const coercedNumber = type("string | number")
	.pipe((s) => {
		if (typeof s === "number") return s;
		const n = Number(s);
		return Number.isNaN(n) ? s : n;
	})
	.narrow((data, ctx): data is number => {
		if (typeof data !== "number") {
			return ctx.mustBe("a number");
		}
		return true;
	});

/**
 * Coerces a string to a boolean.
 * "true" -> true
 * "false" -> false
 */
const coercedBoolean = type("string | boolean")
	.pipe((s) => {
		if (typeof s === "boolean") return s;
		if (s === "true") return true;
		if (s === "false") return false;
		return s;
	})
	.narrow((data, ctx): data is boolean => {
		if (typeof data !== "boolean") {
			return ctx.mustBe("a boolean");
		}
		return true;
	});

/**
 * Wraps a module to apply coercion to its root and all sub-keywords.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapModule(originalModule: any, coercionType: typeof coercedNumber) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const newModule: any = { root: coercionType };

	for (const key in originalModule) {
		if (key === "root") continue;
		const originalSub = originalModule[key];
		if (typeof originalSub === "function") {
			newModule[key] = coercionType.pipe(originalSub);
		} else {
			newModule[key] = originalSub;
		}
	}
	return newModule as Module<any>;
}

/**
 * The root scope for the ArkEnv library, containing extensions to the ArkType scopes with ArkEnv-specific types like `string.host` and `number.port`.
 */
export const $ = scope({
	string: type.module({
		...type.keywords.string,
		host,
	}),
	number: type.module({
		...wrapModule(type.keywords.number, coercedNumber),
		port,
	}),
	boolean: coercedBoolean,
});

export type $ = (typeof $)["t"];
