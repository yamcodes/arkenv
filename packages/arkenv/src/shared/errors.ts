import type { NextAction } from "./protocol";

/**
 * Stable, machine-actionable error codes emitted in the CLI's JSON output
 * (`--json` / `--agent` mode), structured as dotted `NAMESPACE.SUBCODE` strings.
 *
 * These codes are part of the CLI's **public contract**: consumers such as AI
 * agents and scripts may branch on them to decide how to escalate, so they must
 * never be renamed casually.
 */
export const ERROR_CODES = {
	/**
	 * Technical requirements (e.g. Node.js version) were not met. Bypassable with `--force`.
	 */
	REQUIREMENTS_NOT_MET: "CLI.REQUIREMENTS_NOT_MET",
	/**
	 * The git working tree is not clean. Bypassable with `--force`.
	 */
	GIT_TREE_DIRTY: "CLI.GIT_TREE_DIRTY",
	/**
	 * The target directory is not empty (and holds no `package.json`). Bypassable with `--force`.
	 */
	NON_EMPTY_DIR: "CLI.NON_EMPTY_DIR",
	/**
	 * An unexpected, internal failure. Not a deliberate refusal and not bypassable.
	 */
	INTERNAL: "CLI.INTERNAL_ERROR",
	/**
	 * Schema file or arkenv() call not found.
	 */
	SCHEMA_NOT_FOUND: "CLI.SCHEMA_NOT_FOUND",
	/**
	 * Operation cancelled by user or signal.
	 */
	CANCELLED: "CLI.CANCELLED",
	/**
	 * Unknown command passed to CLI.
	 */
	UNKNOWN_COMMAND: "CLI.UNKNOWN_COMMAND",
	/**
	 * Invalid argument or missing option value.
	 */
	INVALID_ARGUMENT: "CLI.INVALID_ARGUMENT",

	/**
	 * Environment variable validation failure.
	 */
	VALIDATION_FAILED: "ENV.VALIDATION_FAILED",
	/**
	 * Specific invalid environment variable value.
	 */
	INVALID_VALUE: "ENV.INVALID_VALUE",
	/**
	 * Specific missing required environment variable.
	 */
	MISSING_VARIABLE: "ENV.MISSING_VARIABLE",
} as const;

/**
 * One of the stable {@link ERROR_CODES} string values.
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * A deliberate, machine-readable refusal emitted when a safety check trips.
 *
 * Refusals are distinct from unexpected failures: they carry a stable {@link ErrorCode}
 * and next actions so a calling agent can decide whether (and how) to escalate.
 */
export type Refusal = {
	/**
	 * Stable, documented code identifying the refusal reason.
	 */
	code: ErrorCode;
	/**
	 * Human-readable summary of what was refused.
	 */
	message: string;
	/**
	 * Detailed reason why the check failed.
	 */
	why?: string;
	/**
	 * Optional legacy / convenience array of retry flags (e.g. `["--force"]`).
	 */
	retryWith?: string[];
	/**
	 * Structured next actions for machine-executable remediation.
	 */
	nextActions?: NextAction[];
	/**
	 * Structured detail sufficient for a consumer to report the problem.
	 */
	details?: Record<string, unknown>;
};
