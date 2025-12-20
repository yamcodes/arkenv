import { host } from "@repo/keywords";
import { scope, type } from "arktype";

/**
 * Coerces a string to a number.
 */
export const coercedNumber = type("string | number")
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
 */
export const coercedBoolean = type(
	"'true' | 'false' | true | false",
	"=>",
	(data) => data === "true" || data === true,
);

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
	number: type.keywords.number,
	boolean: type.keywords.boolean,
});

export type $ = (typeof $)["t"];
