/**
 * Strips ANSI escape codes from a string.
 * Useful for testing terminal output without formatting.
 */
export function stripAnsi(str: string | undefined): string {
	if (!str) return "";
	// biome-ignore lint/suspicious/noControlCharactersInRegex: Standard ANSI escape code stripping
	return str.replace(/\x1B\[[0-9;]*[JKmsu]/g, "");
}
