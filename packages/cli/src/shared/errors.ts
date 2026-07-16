/**
 * Stable, machine-actionable error codes emitted in the CLI's JSON output
 * (`--json` / `--agent` mode).
 *
 * These codes are part of the CLI's **public contract**: consumers such as AI
 * agents and scripts may branch on them to decide how to escalate, so they must
 * never be renamed casually. Codes fall into two groups:
 *
 * - **Refusals** — deliberate safety-check refusals. When bypassable, the emitted
 *   payload includes a `retryWith` array naming the flag(s) that would proceed
 *   anyway (e.g. `["--force"]`).
 * - **`INTERNAL`** — an unexpected failure (the CLI *broke* rather than *refused*).
 *   This lets consumers distinguish a deliberate refusal from a crash.
 */
export const ERROR_CODES = {
	/** Technical requirements (e.g. Node.js version) were not met. Bypassable with `--force`. */
	REQUIREMENTS_NOT_MET: "REQUIREMENTS_NOT_MET",
	/** The git working tree is not clean. Bypassable with `--force`. */
	GIT_TREE_DIRTY: "GIT_TREE_DIRTY",
	/** The target directory is not empty (and holds no `package.json`). Bypassable with `--force`. */
	NON_EMPTY_DIR: "NON_EMPTY_DIR",
	/** An unexpected, internal failure. Not a deliberate refusal and not bypassable. */
	INTERNAL: "INTERNAL",
} as const;

/**
 * One of the stable {@link ERROR_CODES} string values.
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * A deliberate, machine-readable refusal emitted when a safety check trips.
 *
 * Refusals are distinct from unexpected failures: they carry a stable {@link ErrorCode}
 * and a `retryWith` hint so a calling agent can decide whether (and how) to escalate
 * without pattern-matching on human-oriented prose.
 */
export type Refusal = {
	/** Stable, documented code identifying the refusal reason. */
	code: ErrorCode;
	/** Human-readable summary of what was refused. */
	message: string;
	/**
	 * Flags that would bypass the check when re-run (e.g. `["--force"]`).
	 * Empty when the refusal cannot be bypassed.
	 */
	retryWith: string[];
	/** Structured detail sufficient for a consumer to report the problem. */
	details?: Record<string, unknown>;
};
