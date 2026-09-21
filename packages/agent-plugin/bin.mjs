#!/usr/bin/env node
/**
 * Workspace-safe CLI entry. pnpm links this file before `dist/bin.js` exists.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const distBin = join(dirname(fileURLToPath(import.meta.url)), "dist", "bin.js");

if (!existsSync(distBin)) {
	// biome-ignore lint/suspicious/noConsole: CLI reports a missing build to stderr
	console.error(
		"@arkenv/agent-plugin is not built yet. From the repo root, run:\n  nub run build --filter=@arkenv/agent-plugin",
	);
	process.exit(1);
}

await import(pathToFileURL(distBin).href);
