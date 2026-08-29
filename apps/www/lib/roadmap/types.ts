import type { RoadmapTopic } from "~/lib/roadmap/topics";

/**
 * One row on the public roadmap checklist.
 */
export type RoadmapItem = {
	/**
	 * Stable key for React lists (`issue:123` or `extra:release-v1`).
	 */
	id: string;
	/**
	 * Display title (milestone `(v1)` markers stripped).
	 */
	title: string;
	done: boolean;
	/**
	 * Topic bucket for grouping under Up next / Done.
	 */
	topic: RoadmapTopic;
	/**
	 * GitHub issue URL when the row comes from the milestone.
	 */
	href?: string;
	/**
	 * Issue number when the row comes from the milestone.
	 */
	number?: number;
};

/**
 * Assembled roadmap payload for the `/roadmap` page.
 */
export type RoadmapData = {
	milestone: {
		number: number;
		title: string;
		url: string;
	};
	items: RoadmapItem[];
	doneCount: number;
	totalCount: number;
	percent: number;
	/**
	 * True when GitHub could not be reached; extras-only fallback may apply.
	 */
	stale: boolean;
};
