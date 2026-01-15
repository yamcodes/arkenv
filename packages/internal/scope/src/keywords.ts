import { type } from "arktype";

/**
 * A `number` integer between 0 and 65535.
 */
export const port = type("0 <= number.integer <= 65535");

/**
 * An IP address or `"localhost"`
 */
export const host = type("string.ip | 'localhost'");

/**
 * A loose JSON morph.
 *
 * **In**: `unknown`
 *
 * **Out**: A parsed JSON object if the input is a valid JSON string; otherwise the original input.
 *
 * Useful for coercion in unions where failing on non-JSON strings would block other branches.
 */
export const maybeJson = type("unknown").pipe((s) => {
	if (typeof s !== "string") return s;
	const trimmed = s.trim();
	// Only attempt to parse if it looks like JSON (starts with { or [)
	if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return s;
	try {
		return JSON.parse(trimmed);
	} catch {
		return s;
	}
});
