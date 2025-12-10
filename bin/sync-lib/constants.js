import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Go up two levels: bin/sync-lib -> bin -> root
export const ROOT_DIR = join(__dirname, "..", "..");
export const PLAYGROUNDS_DIR = join(ROOT_DIR, "apps", "playgrounds");
export const EXAMPLES_DIR = join(ROOT_DIR, "examples");

// Default files/directories to exclude from sync
export const DEFAULT_EXCLUDES = [
	".cursor",
	"node_modules",
	"dist",
	".turbo",
	".pnpm-debug.log",
	"pnpm-lock.yaml", // Examples use npm/bun lockfiles instead
	"eslint.config.js", // Monorepo uses biome, examples don't need eslint
];
