import { isDebugSecrets, shouldRedact } from "@repo/utils";

/**
 * Severity level for diagnostic entries.
 */
export type Severity = "error" | "warn" | "info";

/**
 * Allowed kinds for NextAction matching Prisma 8 CLI engine protocol.
 */
export type NextActionKind =
	| "run-command"
	| "open-url"
	| "user-choice"
	| "edit-file"
	| "done";

/**
 * Actionable remediation step for AI agents and human users.
 */
export type NextAction = {
	/**
	 * Discriminator identifying the type of action.
	 */
	kind: NextActionKind;
	/**
	 * Human-readable and agent-readable label describing the action.
	 */
	label: string;
	/**
	 * Shell command to execute (for `run-command`). Mutually exclusive with `commands`.
	 */
	command?: string;
	/**
	 * Multiple shell commands to execute in sequence (for `run-command`). Mutually exclusive with `command`.
	 */
	commands?: string[];
	/**
	 * URL to open in browser (for `open-url`).
	 */
	url?: string;
	/**
	 * Optional reason explaining why this action is recommended.
	 */
	reason?: string;
	/**
	 * File location associated with the action (e.g. file to edit).
	 */
	where?: {
		path?: string;
		line?: number;
	};
	/**
	 * Redaction-safe metadata for machine consumers.
	 */
	meta?: Record<string, unknown>;
};

/**
 * Structured diagnostic finding or error report.
 */
export type Diagnostic = {
	/**
	 * Dotted NAMESPACE.SUBCODE code matching `/^[A-Z][A-Z0-9]*\.[A-Z][A-Z0-9_]*$/`.
	 */
	code: string;
	/**
	 * Severity of this diagnostic.
	 */
	severity: Severity;
	/**
	 * Short summary of the diagnostic finding or error.
	 */
	summary: string;
	/**
	 * Detailed explanation of why the failure or finding occurred.
	 */
	why?: string;
	/**
	 * Documentation URL with more details.
	 */
	docsUrl?: string;
	/**
	 * File path and optional line location where the issue originated.
	 */
	where?: {
		path?: string;
		line?: number;
	};
	/**
	 * Redaction-safe structured metadata.
	 */
	meta?: Record<string, unknown>;
	/**
	 * Actionable next steps to resolve this diagnostic.
	 */
	nextActions: NextAction[];
};

/**
 * Successful or completed run envelope matching Prisma 8 CLI engine protocol.
 */
export type CompletedEnvelope<T = unknown> = {
	ok: true;
	/**
	 * Canonical command path (e.g. "check", "init", "preset").
	 */
	commandId: string;
	/**
	 * Command-specific result payload.
	 */
	result: T;
	/**
	 * Process exit code (0 for clean success, or 4-99 for findings).
	 */
	exitCode: number;
	/**
	 * Accompanying findings or diagnostics ([] if none).
	 */
	diagnostics: Diagnostic[];
	/**
	 * Actionable next steps ([] if none).
	 */
	nextActions: NextAction[];
};

/**
 * Errored run envelope matching Prisma 8 CLI engine protocol.
 */
export type ErroredEnvelope = {
	ok: false;
	/**
	 * Canonical command path (e.g. "check", "init", "preset").
	 */
	commandId: string;
	/**
	 * Primary abort diagnostic.
	 */
	error: Diagnostic;
	/**
	 * Accompanying findings ([] if none).
	 */
	diagnostics: Diagnostic[];
	/**
	 * Copy of primary error nextActions ([] if none).
	 */
	nextActions: NextAction[];
};

/**
 * Unified CLI envelope union.
 */
export type CliEnvelope<T = unknown> = CompletedEnvelope<T> | ErroredEnvelope;

/**
 * Stable dotted error codes for the CLI and ENV namespaces.
 */
export const PROTOCOL_ERROR_CODES = {
	// CLI namespace
	CLI_INTERNAL_ERROR: "CLI.INTERNAL_ERROR",
	CLI_SCHEMA_NOT_FOUND: "CLI.SCHEMA_NOT_FOUND",
	CLI_REQUIREMENTS_NOT_MET: "CLI.REQUIREMENTS_NOT_MET",
	CLI_GIT_TREE_DIRTY: "CLI.GIT_TREE_DIRTY",
	CLI_NON_EMPTY_DIR: "CLI.NON_EMPTY_DIR",
	CLI_CANCELLED: "CLI.CANCELLED",
	CLI_UNKNOWN_COMMAND: "CLI.UNKNOWN_COMMAND",
	CLI_INVALID_ARGUMENT: "CLI.INVALID_ARGUMENT",

	// ENV namespace
	ENV_VALIDATION_FAILED: "ENV.VALIDATION_FAILED",
	ENV_INVALID_VALUE: "ENV.INVALID_VALUE",
	ENV_MISSING_VARIABLE: "ENV.MISSING_VARIABLE",
} as const;

/**
 * Resolve the binary execution name for command strings.
 *
 * Checks npm user agent and process execution path to determine
 * whether the CLI is invoked via pnpm, npx, bun, yarn, or direct binary.
 *
 * @returns The resolved executable name (e.g. "pnpm arkenv", "npx arkenv", "arkenv")
 */
export function getBinName(): string {
	const userAgent = process.env.npm_config_user_agent || "";
	if (userAgent.includes("pnpm")) {
		return process.env.npm_command === "dlx"
			? "pnpm dlx arkenv"
			: "pnpm arkenv";
	}
	if (userAgent.includes("bun")) {
		const execPath = process.env._ || process.argv[1] || "";
		return execPath.includes("bunx") || process.env.npm_command === "x"
			? "bunx arkenv"
			: "bun arkenv";
	}
	if (userAgent.includes("yarn")) {
		return process.env.npm_command === "dlx"
			? "yarn dlx arkenv"
			: "yarn arkenv";
	}
	if (userAgent.includes("npm")) {
		return "npx arkenv";
	}

	const execPath = process.env._ || process.argv[1] || "";
	if (execPath.includes("npx")) return "npx arkenv";
	if (execPath.includes("bunx")) return "bunx arkenv";
	if (execPath.includes("pnpm")) return "pnpm arkenv";
	if (execPath.includes("yarn")) return "yarn arkenv";
	if (execPath.includes("bun")) return "bun arkenv";

	return "arkenv";
}

/**
 * Replace all `{bin}` placeholders with the resolved binary name.
 *
 * @param text Command string or template
 * @param binName Optional override for binary name
 * @returns String with `{bin}` replaced
 */
export function resolveBinString(text: string, binName = getBinName()): string {
	return text.replace(/\{bin\}/g, binName);
}

/**
 * Resolve `{bin}` placeholders in a NextAction.
 *
 * @param action NextAction to resolve
 * @param binName Optional override for binary name
 * @returns Cloned NextAction with resolved commands
 */
export function resolveNextActionBin(
	action: NextAction,
	binName = getBinName(),
): NextAction {
	const resolved: NextAction = { ...action };
	if (resolved.command) {
		resolved.command = resolveBinString(resolved.command, binName);
	}
	if (resolved.commands) {
		resolved.commands = resolved.commands.map((cmd) =>
			resolveBinString(cmd, binName),
		);
	}
	return resolved;
}

/**
 * Strip ANSI color and control characters from strings.
 *
 * @param str Input string
 * @returns Clean string without ANSI formatting
 */
export function stripAnsi(str: string): string {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape sequences
	return str.replace(/\x1B\[\d+m/g, "").replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}

/**
 * Sanitize error messages and text to ensure sensitive secrets are not exposed.
 *
 * @param text The summary or why string
 * @param key The environment variable key name
 * @param config Optional debug secrets config
 * @returns Sanitized string
 */
export function sanitizeSecretText(
	text: string,
	key?: string,
	config?: { debugSecrets?: boolean },
): string {
	const clean = stripAnsi(text);
	if (config?.debugSecrets || isDebugSecrets(config?.debugSecrets)) {
		return clean;
	}

	if (key && shouldRedact(key)) {
		// Replace any '(was ...)' patterns with '(was [REDACTED])' even if value contains parens
		return clean.replace(/\(was .*\)/g, "(was [REDACTED])");
	}

	return clean;
}
