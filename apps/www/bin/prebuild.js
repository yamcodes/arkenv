#!/usr/bin/env node
/**
 * Under `turbo run build`, dependency packages and `mdx` already ran via
 * `dependsOn: ["^build", "mdx"]`. Re-running `nub run --filter @arkenv/nextjs
 * build` here races other playgrounds that consume `dist/` (missing
 * `@arkenv/nextjs`). Skip the nested rebuild when Turbo is driving the task;
 * keep it for bare `pnpm build` / `nub run build` in www.
 */
import { spawnSync } from "node:child_process";

if (process.env.TURBO_HASH) {
	process.exit(0);
}

const result = spawnSync(
	"nub",
	[
		"run",
		"--filter",
		"@arkenv/fumadocs-ui",
		"--filter",
		"@arkenv/nextjs",
		"build",
	],
	{ stdio: "inherit", shell: false },
);
if (result.status) process.exit(result.status ?? 1);

const mdx = spawnSync("nub", ["run", "mdx"], {
	stdio: "inherit",
	shell: false,
});
process.exit(mdx.status ?? 1);
