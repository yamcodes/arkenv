/**
 * Manual roadmap rows that are not GitHub issues (launch gates, audits).
 * Milestone issues remain the source of truth for tracked work; these append.
 */
export type RoadmapExtra = {
	/**
	 * Stable id fragment (`extra:${id}`).
	 */
	id: string;
	title: string;
	done: boolean;
};

/**
 * GitHub milestone number that drives the checklist (v1).
 */
export const ROADMAP_MILESTONE_NUMBER = 1;

/**
 * Meta trackers on the milestone that must not appear as checklist rows.
 */
export const ROADMAP_EXCLUDE_ISSUE_NUMBERS = new Set([683]);

/**
 * Launch / narrative items carried over from the old #683 issue body.
 * Flip `done` when each ships; do not invent parallel issue trackers for these.
 */
export const ROADMAP_EXTRAS: readonly RoadmapExtra[] = [
	{
		id: "parity-audit",
		title: "Final v0 parity audit",
		done: false,
	},
	{
		id: "release-v1",
		title: "Release v1",
		done: false,
	},
	{
		id: "v1-announcement",
		title: "Document v1 announcement",
		done: false,
	},
];
