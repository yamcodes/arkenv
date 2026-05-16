/**
 * Returns the appropriate 'dlx' or 'exec' command for the given package manager.
 *
 * @param pm The package manager name (e.g., "pnpm", "bun").
 * @returns The dlx command array.
 */
export function getDlxCommand(pm: string): string[] {
	switch (pm) {
		case "pnpm":
			return ["pnpm", "dlx"];
		case "yarn":
			return ["yarn", "dlx"];
		case "bun":
			return ["bunx"];
		default:
			return ["npx"];
	}
}
