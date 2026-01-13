/**
 * Attempts to coerce a value to a number.
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
	if (typeof s !== "string") return s;
	const trimmed = s.trim();
	if (trimmed === "") return s;
	if (trimmed === "NaN") return Number.NaN;
	const n = Number(trimmed);
	return Number.isNaN(n) ? s : n;
};

/**
 * Attempts to coerce a value to a boolean.
 *
 * Converts the strings "true" and "false" to their boolean equivalents.
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
 * Attempts to parse a value as JSON.
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
	if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return s;
	try {
		return JSON.parse(trimmed);
	} catch {
		return s;
	}
};
