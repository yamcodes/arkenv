import { host, port } from "@repo/keywords";
import { scope, type Type, type } from "arktype";

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
 * Coerce a string to a boolean.
 * "true" -> true
 * "false" -> false
 * (if it was already a boolean, it stays as such)
 */
const coercedBoolean = type(
	"'true' | 'false' | true | false",
	"=>",
	(str) => str === "true" || str === true,
);

/**
 * Wraps a module to apply coercion to its root and all sub-keywords.
 */
function wrapModule<T extends object, C extends { pipe(sub: Type): unknown }>(
	originalModule: T,
	coercionType: C,
) {
	const newModule: Record<string, unknown> = {
		root: coercionType,
	};

	const originalRecord = originalModule as Record<string, unknown>;

	for (const key in originalRecord) {
		if (key === "root") continue;
		const originalSub = originalRecord[key];

		if (
			typeof originalSub === "function" &&
			"arkKind" in originalSub &&
			originalSub.arkKind === "type"
		) {
			// ArkType's internal Module members are valid types at runtime, but their
			// TS representation in the keyword modules doesn't always overlap cleanly
			// with the public Type interface. We verify compatibility at runtime via arkKind.
			// biome-ignore lint/suspicious/noExplicitAny: Avoid double-casting while maintaining runtime safety.
			newModule[key] = coercionType.pipe(originalSub as any);
		} else {
			newModule[key] = originalSub;
		}
	}
	return newModule as {
		[K in keyof T]: K extends "root" ? C : T[K];
	} & { root: C };
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
