import type { RoadmapTopic } from "~/lib/roadmap/topics";

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
	topic: RoadmapTopic;
};

/**
 * GitHub milestone number that drives the checklist (v1).
 */
export const ROADMAP_MILESTONE_NUMBER = 1;

/**
 * Meta / launch-gate trackers on the milestone that must not appear as
 * checklist rows (they are represented by `ROADMAP_EXTRAS` instead).
 */
export const ROADMAP_EXCLUDE_ISSUE_NUMBERS = new Set([
	683, // former living roadmap issue
	1306, // README alpha → production links (extra: readme-prod-links)
	1590, // changelog epoch warnings (extra: changelog-epoch)
]);

/**
 * Launch / narrative items carried over from the old #683 issue body (plus
 * launch-meta issues folded out of the milestone checklist).
 * Flip `done` when each ships; order here is the public “Up next” order.
 */
export const ROADMAP_EXTRAS: readonly RoadmapExtra[] = [
	{
		id: "parity-audit",
		title: "Final v0 parity audit",
		done: false,
		topic: "Core",
	},
	{
		id: "v0-alpha-banner",
		title: "v0 site Alpha banner",
		done: true,
		topic: "Docs",
	},
	{
		id: "readme-prod-links",
		title: "Update README links from alpha to production",
		done: false,
		topic: "Docs",
	},
	{
		id: "changelog-epoch",
		title: "Prepend changelog epoch warnings",
		done: false,
		topic: "Docs",
	},
	{
		id: "cli-postinstall-guard",
		title: "Add CLI postinstall guard for v0 upgrades",
		done: true,
		topic: "CLI",
	},
	{
		id: "npm-deprecate-cli",
		title: "Deprecate @arkenv/cli on npm",
		done: false,
		topic: "CLI",
	},
	{
		id: "v0-archive-dns-cutover",
		title: "Deploy v0.arkenv.js.org archive and flip primary DNS",
		done: false,
		topic: "Docs",
	},
	{
		id: "release-v1",
		title: "Release v1",
		done: false,
		topic: "Core",
	},
	{
		id: "v1-announcement",
		title: "Document v1 announcement",
		done: false,
		topic: "Docs",
	},
];
