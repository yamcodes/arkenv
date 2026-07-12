/**
 * Check if we're in a Node environment (not browser).
 */
export const isNode = (): boolean =>
	typeof process !== "undefined" &&
	process.versions != null &&
	process.versions.node != null;

/**
 * Whether ANSI colors should be disabled.
 *
 * Respects `NO_COLOR`, `FORCE_COLOR`, CI, and TTY detection in a browser-safe way.
 */
export function shouldDisableColors(): boolean {
	if (!isNode()) return true;

	const env = process.env;

	if (env.FORCE_COLOR !== undefined && env.FORCE_COLOR !== "0") {
		return false;
	}

	if (env.NO_COLOR !== undefined) return true;

	if (env.CI !== undefined) return true;

	if (process.stdout && !process.stdout.isTTY) return true;

	return false;
}
