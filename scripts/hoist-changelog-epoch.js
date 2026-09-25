/**
 * Keep v1 package-identity banners at the top of the two changelogs
 * that swapped names.
 *
 * `changeset version` inserts the next release immediately under the
 * first line (the `# package` heading). These banners must stay above
 * that release, so the version command hoists them back.
 *
 * Usage:
 *   node scripts/hoist-changelog-epoch.js
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export const EPOCH_START = "<!-- arkenv-epoch -->";
export const EPOCH_END = "<!-- /arkenv-epoch -->";

export const EPOCH_CHANGELOGS = [
	"packages/arkenv/CHANGELOG.md",
	"packages/core/CHANGELOG.md",
];

/**
 * Move the epoch block to sit directly under the first line.
 *
 * @param {string} markdown
 * @returns {string}
 */
export function hoistEpochBanner(markdown) {
	const start = markdown.indexOf(EPOCH_START);
	const end = markdown.indexOf(EPOCH_END);
	if (start === -1 || end === -1 || end < start) return markdown;

	const blockEnd = end + EPOCH_END.length;
	const block = markdown.slice(start, blockEnd).trim();
	const without =
		`${markdown.slice(0, start)}${markdown.slice(blockEnd)}`.replace(
			/\n{3,}/g,
			"\n\n",
		);
	const newline = without.indexOf("\n");
	if (newline === -1) return `${without}\n\n${block}\n`;

	const head = without.slice(0, newline);
	const rest = without.slice(newline + 1).replace(/^\n+/, "");
	const body = rest.endsWith("\n") || rest.length === 0 ? rest : `${rest}\n`;
	return `${head}\n\n${block}\n\n${body}`;
}

/**
 * @param {string} [root]
 */
export function hoistChangelogEpochs(root = process.cwd()) {
	for (const relativePath of EPOCH_CHANGELOGS) {
		const changelogPath = resolve(root, relativePath);
		const current = readFileSync(changelogPath, "utf8");
		const next = hoistEpochBanner(current);
		if (next !== current) writeFileSync(changelogPath, next);
	}
}

const isDirectRun = process.argv[1]?.endsWith("hoist-changelog-epoch.js");
if (isDirectRun) hoistChangelogEpochs();
