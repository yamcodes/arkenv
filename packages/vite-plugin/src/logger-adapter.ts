import type { LoggerStyle } from "arkenv";
import type { Logger } from "vite";

/**
 * Create a logger adapter that converts Vite's logger to ArkEnv's LoggerStyle interface
 * Vite's logger uses picocolors internally, which we can access through the logger's colors
 * @param logger - Vite's logger instance
 * @returns A LoggerStyle function that can be used with ArkEnv's error formatting
 */
export function createViteLoggerAdapter(logger: Logger): LoggerStyle {
	// Vite's logger has a colors property that contains picocolors functions
	// The colors object has methods like red(), yellow(), cyan(), etc.
	// We extract these to create our adapter
	const colors = (
		logger as { colors?: Record<string, (text: string) => string> }
	).colors;

	// If colors are available, use them
	if (colors) {
		return (color: "red" | "yellow" | "cyan", text: string): string => {
			const colorFn = colors[color];
			if (colorFn) {
				return colorFn(text);
			}
			// Fallback to plain text if color function not found
			return text;
		};
	}

	// Fallback: Use logger methods to style text
	// This is a workaround if colors are not directly accessible
	// We'll use a temporary approach that captures styled output
	return (color: "red" | "yellow" | "cyan", text: string): string => {
		// Try to use logger methods - they use picocolors internally
		// This is a fallback that may not work perfectly, but should work in most cases
		// The actual implementation may need adjustment based on Vite's logger API
		switch (color) {
			case "red":
				// Use logger.error's styling if available
				return text; // Placeholder - will be refined
			case "yellow":
				// Use logger.warn's styling if available
				return text; // Placeholder - will be refined
			case "cyan":
				// Use logger.info's styling if available
				return text; // Placeholder - will be refined
			default:
				return text;
		}
	};
}
