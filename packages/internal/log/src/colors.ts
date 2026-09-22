/**
 * Check if we're in a Node environment (not browser).
 *
 * Reads `process` through `Reflect.get` so Next.js edge bundling does not
 * treat Node version or stdout APIs as unsupported.
 */
type ProcessLike = {
	env?: NodeJS.ProcessEnv;
	versions?: { node?: string | null } | null;
	stdout?: { isTTY?: boolean } | null;
};

function getProcess(): ProcessLike | undefined {
	try {
		const proc = Reflect.get(globalThis, "process") as ProcessLike | undefined;
		if (proc && typeof proc === "object") return proc;
	} catch {
		// Edge / browser: `process` may be a restricted getter.
	}
	return undefined;
}

export const isNode = (): boolean => Boolean(getProcess()?.versions?.node);

/**
 * Whether ANSI colors should be disabled.
 *
 * Respects `NO_COLOR`, `FORCE_COLOR`, CI, and TTY detection in a browser-safe way.
 */
export function shouldDisableColors(): boolean {
	const proc = getProcess();
	if (!proc?.versions?.node) return true;

	const env = proc.env ?? {};

	if (env.FORCE_COLOR === "0") return true;

	if (env.FORCE_COLOR !== undefined && env.FORCE_COLOR !== "0") {
		return false;
	}

	if (env.NO_COLOR !== undefined) return true;

	if (env.CI !== undefined) return true;

	const stdout = proc.stdout;
	if (stdout && !stdout.isTTY) return true;

	return false;
}
