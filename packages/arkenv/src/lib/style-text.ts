/**
 * Cross-platform text styling utility
 * Uses ANSI colors in Node environments, plain text in browsers
 * Respects NO_COLOR, CI environment variables, and TTY detection
 */

// ANSI color codes for Node environments
const colors = {
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	cyan: "\x1b[36m",
	reset: "\x1b[0m",
} as const;

/**
 * Check if we're in a Node environment (not browser)
 * Checked dynamically to allow for testing with mocked globals
 */
const isNode = (): boolean =>
	typeof process !== "undefined" &&
	process.versions != null &&
	process.versions.node != null;

/**
 * Check if colors should be disabled based on environment
 * Respects NO_COLOR, CI environment variables, and TTY detection
 */
const shouldDisableColors = (): boolean => {
	if (!isNode()) return true;

	// Respect NO_COLOR environment variable (https://no-color.org/)
	if (process.env.NO_COLOR !== undefined) return true;

	// Disable colors in CI environments by default
	if (process.env.CI !== undefined) return true;

	// Disable colors if not writing to a TTY
	if (process.stdout && !process.stdout.isTTY) return true;

	return false;
};

/**
 * Style text with color. Uses ANSI codes in Node, plain text in browsers.
 * @param color - The color to apply
 * @param text - The text to style
 * @returns Styled text in Node (if colors enabled), plain text otherwise
 */
export const styleText = (
	color: "red" | "yellow" | "cyan",
	text: string,
): string => {
	// Use ANSI colors only in Node environments with colors enabled
	if (isNode() && !shouldDisableColors()) {
		return `${colors[color]}${text}${colors.reset}`;
	}
	// Fall back to plain text in browsers or when colors are disabled
	return text;
};
