/**
 * Cross-platform text styling utility
 * Provides styleText functionality with fallback for browser environments
 */

// Fallback implementation for environments that don't support node:util
const fallbackStyleText = (_style: string | string[], text: string): string =>
	text;

// Try to import styleText from node:util, fallback to a no-op implementation for browsers
let styleText: (style: string | string[], text: string) => string;

try {
	// Check if we're in a Node.js environment
	if (process?.versions?.node) {
		// Dynamic import for Node.js environments only
		styleText = require("node:util").styleText;
	} else {
		styleText = fallbackStyleText;
	}
} catch {
	// Fallback for browser environments - just return the text without styling
	styleText = fallbackStyleText;
}

export { styleText };
