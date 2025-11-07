/**
 * Cross-platform text styling utility
 * Uses ANSI colors in Node environments, plain text in browsers
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
 */
const isNode =
	typeof process !== "undefined" &&
	process.versions != null &&
	process.versions.node != null;

/**
 * Style text with color. Uses ANSI codes in Node, plain text in browsers.
 * @param color - The color to apply
 * @param text - The text to style
 * @returns Styled text in Node, plain text in browsers
 */
export const styleText = (
	color: "red" | "yellow" | "cyan",
	text: string,
): string => {
	// Use ANSI colors in Node environments
	if (isNode) {
		return `${colors[color]}${text}${colors.reset}`;
	}
	// Fall back to plain text in browsers
	return text;
};

