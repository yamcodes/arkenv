#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/**
 * Entry point for `pnpm create arkenv` / `npm create arkenv` / `yarn create arkenv`.
 * Proxies all arguments to `arkenv init`.
 */
function main() {
	const cliBin = require.resolve("@arkenv/cli");
	const args = process.argv.slice(2);

	const result = spawnSync(process.execPath, [cliBin, "init", ...args], {
		stdio: "inherit",
		shell: false,
	});

	process.exit(result.status ?? 0);
}

main();
