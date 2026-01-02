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
	if (typeof s !== "string") return s;
	const trimmed = s.trim();
	if (trimmed === "") return s;
	if (trimmed === "NaN") return Number.NaN;
	const n = Number(trimmed);
	return Number.isNaN(n) ? s : n;
});

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
 * A `number` integer between 0 and 65535.
 */
export const port = type("0 <= number.integer <= 65535");

/**
 * An IP address or `"localhost"`
 */
export const host = type("string.ip | 'localhost'");

const arrayParser = <T>(s: string | T[], transform: (s: string) => T): T[] => {
	if (typeof s !== "string") return s;
	if (!s.trim()) return [];
	return s.split(",").map((part) => transform(part.trim()));
};

/**
 * A comma-separated list of strings.
 *
 * **In**: `string | string[]`
 *
 * **Out**: `string[]`
 */
export const stringArray = type("string | string[]").pipe((s) =>
	arrayParser(s, (s) => s),
);

/**
 * A comma-separated list of numbers.
 *
 * **In**: `string | number[]`
 *
 * **Out**: `number[]`
 */
export const numberArray = type("string | number[]").pipe((s) =>
	arrayParser(s, (part) => {
		const n = Number(part);
		if (part === "" || Number.isNaN(n)) {
			throw new Error(`Expected a number but got '${part}'`);
		}
		return n;
	}),
);

/**
 * A comma-separated list of booleans.
 *
 * **In**: `string | boolean[]`
 *
 * **Out**: `boolean[]`
 */
export const booleanArray = type("string | boolean[]").pipe((s) =>
	arrayParser(s, (part) => {
		if (part === "true") return true;
		if (part === "false") return false;
		throw new Error(`Expected a boolean but got '${part}'`);
	}),
);

/**
 * A JSON string representing an array.
 *
 * **In**: `string`
 *
 * **Out**: `unknown[]`
 */
export const jsonArray = type("string").pipe((s) => {
	try {
		const result = JSON.parse(s);
		if (!Array.isArray(result)) {
			throw new Error("Expected a JSON array");
		}
		return result;
	} catch (e) {
		throw new Error(e instanceof Error ? e.message : String(e));
	}
});

/**
 * A comma-separated list of mixed values (boolean, number, string).
 *
 * **In**: `string | (string | number | boolean)[]`
 *
 * **Out**: `(string | number | boolean)[]`
 */
export const mixedArray = type("string | (string | number | boolean)[]").pipe(
	(s) =>
		arrayParser(s, (part) => {
			if (part === "true") return true;
			if (part === "false") return false;

			const n = Number(part);
			if (part !== "" && !Number.isNaN(n)) {
				return n;
			}
			return part;
		}),
);
