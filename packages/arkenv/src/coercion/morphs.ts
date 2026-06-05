/**
 * Attempt to coerce a value to a number.
 *
 * If the input is already a number, returns it unchanged.
 * If the input is a string that can be parsed as a number, returns the parsed number.
 * Otherwise, returns the original value unchanged.
 *
 * @internal
 * @param s - The value to coerce
 * @returns The coerced number or the original value
 */
export const coerceNumber = (s: unknown) => {
	if (typeof s === "number") return s;
	if (typeof s !== "string" || !s.trim()) return s;
	if (s.trim() === "NaN") return Number.NaN;
	const n = Number(s);
	return Number.isNaN(n) ? s : n;
};

/**
 * Attempt to coerce a value to a boolean.
 *
 * Convert the strings "true" and "false" to their boolean equivalents.
 * All other values are returned unchanged.
 *
 * @internal
 * @param s - The value to coerce
 * @returns The coerced boolean or the original value
 */
export const coerceBoolean = (s: unknown) => {
	if (s === "true") return true;
	if (s === "false") return false;
	return s;
};

/**
 * Attempt to parse a value as JSON.
 *
 * If the input is a string that starts with `{` or `[` and can be parsed as JSON,
 * returns the parsed object or array. Otherwise, returns the original value unchanged.
 *
 * @internal
 * @param s - The value to parse
 * @returns The parsed JSON or the original value
 */
export const coerceJson = (s: unknown) => {
	if (typeof s !== "string") return s;
	const trimmed = s.trim();
	if (trimmed[0] !== "{" && trimmed[0] !== "[") return s;
	try {
		return JSON.parse(trimmed);
	} catch {
		return s;
	}
};

/**
 * Attempt to coerce a value to a Date.
 *
 * If the input is already a Date, returns it unchanged.
 * If the input is a valid date string, returns a Date object.
 * Otherwise, returns the original value unchanged.
 *
 * @internal
 * @param s - The value to coerce
 * @returns The coerced Date or the original value
 */
export const coerceDate = (s: unknown) => {
	if (s instanceof Date) return s;
	if (typeof s !== "string" || !s.trim()) return s;
	const d = new Date(s);
	return Number.isNaN(d.getTime()) ? s : d;
};
