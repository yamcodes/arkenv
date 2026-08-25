export type HeadingPosition = {
	id: string;
	top: number;
};

/**
 * Last heading whose top is at or above the spy line (document order).
 * If every heading is still below the line, the first heading wins.
 */
export function getActiveHeadingId(
	headings: readonly HeadingPosition[],
	spyOffset: number,
): string | undefined {
	if (headings.length === 0) return undefined;
	let activeId = headings[0].id;
	for (const heading of headings) {
		if (heading.top <= spyOffset) activeId = heading.id;
		else break;
	}
	return activeId;
}

export function tocItemId(url: string): string | null {
	return url.startsWith("#") ? url.slice(1) : null;
}
