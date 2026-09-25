/**
 * `changeset version`, then hoist the v1 package-identity banners.
 *
 * Changesets inserts each new release under the changelog heading.
 * The epoch blocks in the CLI and core changelogs must stay above that
 * release. The release workflow calls this instead of `changeset version`.
 *
 * Usage:
 *   node scripts/changeset-version.js
 */

import { spawnSync } from "node:child_process";
import { hoistChangelogEpochs } from "./hoist-changelog-epoch.js";

const result = spawnSync(
	"nubx",
	["changeset", "version", ...process.argv.slice(2)],
	{ stdio: "inherit" },
);

if (result.status !== 0) {
	process.exit(result.status ?? 1);
}

hoistChangelogEpochs();
