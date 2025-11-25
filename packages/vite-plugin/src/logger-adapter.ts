import type { LoggerStyle } from "arkenv";
import type { Logger } from "vite";

/**
 * Create a logger adapter that converts Vite's logger to ArkEnv's LoggerStyle interface
 * Vite's logger uses picocolors internally. We try to access it through the logger instance.
 * @param logger - Vite's logger instance
 * @returns A LoggerStyle function that can be used with ArkEnv's error formatting
 */
export function createViteLoggerAdapter(logger: Logger): LoggerStyle {
	// Try to access picocolors through Vite's logger internal structure
	// Vite's logger may have colors exposed or we can access them through the logger instance
	const loggerWithColors = logger as {
		colors?: {
			red?: (text: string) => string;
			yellow?: (text: string) => string;
			cyan?: (text: string) => string;
		};
	};

	// If colors are directly available, use them
	if (loggerWithColors.colors) {
		const colors = loggerWithColors.colors;
		return (color: "red" | "yellow" | "cyan", text: string): string => {
			const colorFn = colors[color];
			if (colorFn) {
				return colorFn(text);
			}
			return text;
		};
	}

	// Try to access picocolors through require (if available in Vite's context)
	// This is a fallback that works if picocolors is available in the module resolution
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const picocolors = require("picocolors");
		if (picocolors) {
			return (color: "red" | "yellow" | "cyan", text: string): string => {
				switch (color) {
					case "red":
						return picocolors.red(text);
					case "yellow":
						return picocolors.yellow(text);
					case "cyan":
						return picocolors.cyan(text);
					default:
						return text;
				}
			};
		}
	} catch {
		// picocolors not available, fall through to plain text
	}

	// Final fallback: return plain text
	// This maintains functionality even if colors can't be accessed
	return (_color: "red" | "yellow" | "cyan", text: string): string => text;
}
