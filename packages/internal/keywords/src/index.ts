import { type } from "arktype";
/**
 * A loose numeric morph.
 *
 * **In**: `unknown`
 *
 * **Out**: A `number` if the input is a numeric string; otherwise the original input.
 *
 * Useful for coercion in unions where failing on non-numeric strings would block other branches.
 */
export const maybeParsedNumber = type("unknown").pipe((s) => {
	if (typeof s === "number") return s;
	if (typeof s !== "string" || s.trim() === "") return s;
	const n = Number(s);
	return Number.isNaN(n) ? s : n;
});

/**
 * A strict numeric morph.
 *
 * **In**: `string | number`
 *
 * **Out**: A `number`
 *
 * @throws {ArkErrors} If the input cannot be parsed as a number.
 */
export const parsedNumber = maybeParsedNumber.narrow(
	(data, ctx): data is number => {
		if (typeof data !== "number") {
			return ctx.mustBe("a number");
		}
		return true;
	},
);

/**
 * A loose boolean morph.
 *
 * **In**: `unknown`
 *
 * **Out**: `true` for `"true"`, `false` for `"false"`; otherwise the original input.
 *
 * Useful for coercion in unions where failing on non-boolean strings would block other branches.
 */
export const maybeParsedBoolean = type("unknown").pipe((s) => {
	if (s === "true") return true;
	if (s === "false") return false;
	return s;
});

/**
 * A strict boolean morph.
 *
 * **In**: `boolean | 'true' | 'false'`
 *
 * **Out**: `boolean`
 *
 * @throws {ArkErrors} If the input is not a boolean or the strings "true"/"false".
 */
export const parsedBoolean = type(
	"'true' | 'false' | true | false",
	"=>",
	(data) => data === "true" || data === true,
);

/**
 * A `number` integer between 0 and 65535
 */
export const port = type("0 <= number.integer <= 65535");

/**
 * An IP address or `"localhost"`
 */
export const host = type("string.ip | 'localhost'");
