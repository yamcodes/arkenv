const OG_TITLE_MAX_LENGTH = 42;
const OG_DESCRIPTION_MAX_LENGTH = 75;

/**
 * Truncate text to fit the OG image layout, preferring word boundaries.
 *
 * @param text The raw title or description from page metadata
 * @param maxLength Maximum character count including the ellipsis suffix
 * @returns Normalized text, truncated with "..." when it exceeds maxLength
 */
export function truncateOgText(text: string, maxLength: number): string {
	const normalized = text.trim().replace(/\s+/g, " ");
	if (normalized.length <= maxLength) return normalized;

	const slice = normalized.slice(0, maxLength - 3);
	const lastSpace = slice.lastIndexOf(" ");
	const truncated =
		lastSpace > maxLength * 0.5 ? slice.slice(0, lastSpace) : slice;

	return `${truncated.trimEnd()}...`;
}

/**
 * Format a page title for the OG image template.
 *
 * @param title The raw page title from metadata
 * @returns Title truncated to the OG layout limit
 */
export function formatOgTitle(title: string): string {
	return truncateOgText(title, OG_TITLE_MAX_LENGTH);
}

/**
 * Format a page description for the OG image template.
 *
 * @param description The raw page description from metadata
 * @returns Description truncated to the OG layout limit
 */
export function formatOgDescription(description: string): string {
	return truncateOgText(description, OG_DESCRIPTION_MAX_LENGTH);
}
