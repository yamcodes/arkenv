import { lazyType as type } from "./lazy-type";

/**
 * A loose numeric morph function (internal use only).
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
 */
export const maybeNumber = type("unknown").pipe(maybeNumberFn);

/**
 * A loose boolean morph function (internal use only).
 */
export const maybeBooleanFn = (s: unknown) => {
	if (s === "true") return true;
	if (s === "false") return false;
	return s;
};

/**
 * A loose boolean morph.
 */
export const maybeBoolean = type("unknown").pipe(maybeBooleanFn);

/**
 * A loose JSON morph function (internal use only).
 */
export const maybeJsonFn = (s: unknown) => {
	if (typeof s !== "string") return s;
	const trimmed = s.trim();
	if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return s;
	try {
		return JSON.parse(trimmed);
	} catch {
		return s;
	}
};

/**
 * A loose JSON morph.
 */
export const maybeJson = type("unknown").pipe(maybeJsonFn);

/**
 * A `number` integer between 0 and 65535.
 */
export const port = type("0 <= number.integer <= 65535");

/**
 * An IP address or `"localhost"`
 */
export const host = type("string.ip | 'localhost'");
