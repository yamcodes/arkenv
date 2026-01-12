import { lazyType as type } from "@repo/scope";

/**
 * A loose numeric morph function (internal use only).
 *
 * **In**: `unknown`
 *
 * **Out**: A `number` if the input is a numeric string; otherwise the original input.
 *
 * Useful for coercion in unions where failing on non-numeric strings would block other branches.
 */
export const maybeNumberFn = (s: unknown) => {
	if (typeof s === "number") return s;
	if (typeof s !== "string") return s;
	const trimmed = s.trim();
	if (trimmed === "") return s;
	if (trimmed === "NaN") return Number.NaN;
	const n = Number(trimmed);
	return Number.isNaN(n) ? s : n;
};

/**
 * A loose numeric morph.
 *
 * **In**: `unknown`
 *
 * **Out**: A `number` if the input is a numeric string; otherwise the original input.
 *
 * Useful for coercion in unions where failing on non-numeric strings would block other branches.
 */
export const maybeNumber = type("unknown").pipe(maybeNumberFn);

/**
 * A loose boolean morph function (internal use only).
 *
 * **In**: `unknown`
 *
 * **Out**: `true` for `"true"`, `false` for `"false"`; otherwise the original input.
 *
 * Useful for coercion in unions where failing on non-boolean strings would block other branches.
 */
export const maybeBooleanFn = (s: unknown) => {
	if (s === "true") return true;
	if (s === "false") return false;
	return s;
};

/**
 * A loose boolean morph.
 *
 * **In**: `unknown`
 *
 * **Out**: `true` for `"true"`, `false` for `"false"`; otherwise the original input.
 *
 * Useful for coercion in unions where failing on non-boolean strings would block other branches.
 */
export const maybeBoolean = type("unknown").pipe(maybeBooleanFn);

/**
 * A `number` integer between 0 and 65535.
 */
export const port = type("0 <= number.integer <= 65535");

/**
 * An IP address or `"localhost"`
 */
export const host = type("string.ip | 'localhost'");

/**
 * A loose JSON morph function (internal use only).
 *
 * **In**: `unknown`
 *
 * **Out**: A parsed JSON object if the input is a valid JSON string; otherwise the original input.
 *
 * Useful for coercion in unions where failing on non-JSON strings would block other branches.
 */
export const maybeJsonFn = (s: unknown) => {
	if (typeof s !== "string") return s;
	const trimmed = s.trim();
	// Only attempt to parse if it looks like JSON (starts with { or [)
	if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return s;
	try {
		return JSON.parse(trimmed);
	} catch {
		return s;
	}
};

/**
 * A loose JSON morph.
 *
 * **In**: `unknown`
 *
 * **Out**: A parsed JSON object if the input is a valid JSON string; otherwise the original input.
 *
 * Useful for coercion in unions where failing on non-JSON strings would block other branches.
 */
export const maybeJson = type("unknown").pipe(maybeJsonFn);
