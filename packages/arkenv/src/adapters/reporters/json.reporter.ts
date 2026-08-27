import pc from "picocolors";
import { ERROR_CODES, type Refusal } from "@/shared/errors";
import {
	type CompletedEnvelope,
	type ErroredEnvelope,
	type NextAction,
	resolveNextActionBin,
	sanitizeSecretText,
} from "@/shared/protocol";
import type { Reporter, Spinner } from "./types";

/**
 * Reporter implementation that outputs structured JSON logs conforming to Prisma 8 settlement envelopes.
 * Machine-readable output for AI coding agents and CI/CD pipelines.
 */
export class JsonReporter implements Reporter {
	info(message: string) {
		process.stderr.write(`${pc.blue(`ℹ ${message}`)}\n`);
	}

	warn(message: string) {
		process.stderr.write(`${pc.yellow(`⚠ ${message}`)}\n`);
	}

	error(message: string) {
		process.stderr.write(`${pc.red(`✘ ${message}`)}\n`);
	}

	success(message: string) {
		process.stderr.write(`${pc.green(`✔ ${message}`)}\n`);
	}

	step(message: string) {
		process.stderr.write(`○ ${message}\n`);
	}

	note(message: string, title?: string) {
		process.stderr.write(
			`${pc.dim(`○ ${title ? `${title}: ` : ""}${message}`)}\n`,
		);
	}

	log(message: string) {
		process.stderr.write(`${message}\n`);
	}

	spinner(): Spinner {
		return {
			start: (msg: string) =>
				process.stderr.write(`${pc.dim(`○ ${msg}...`)}\n`),
			stop: (msg: string) => process.stderr.write(`${pc.green(`✔ ${msg}`)}\n`),
			message: (msg: string) =>
				process.stderr.write(`${pc.dim(`○ ${msg}...`)}\n`),
		};
	}

	json(data: unknown) {
		process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
	}

	reportCompleted(envelope: CompletedEnvelope) {
		const resolvedDiagnostics = envelope.diagnostics.map((d) => ({
			...d,
			nextActions: (d.nextActions ?? []).map((action) =>
				resolveNextActionBin(action),
			),
		}));
		const resolvedNextActions = (envelope.nextActions ?? []).map((action) =>
			resolveNextActionBin(action),
		);

		this.json({
			ok: true,
			commandId: envelope.commandId,
			result: envelope.result,
			exitCode: envelope.exitCode,
			diagnostics: resolvedDiagnostics,
			nextActions: resolvedNextActions,
		});
	}

	reportErrored(envelope: ErroredEnvelope) {
		const resolvedErrorActions = (envelope.error.nextActions ?? []).map(
			(action) => resolveNextActionBin(action),
		);
		const resolvedNextActions = (
			envelope.nextActions ?? resolvedErrorActions
		).map((action) => resolveNextActionBin(action));
		const resolvedDiagnostics = (envelope.diagnostics ?? []).map((d) => ({
			...d,
			nextActions: (d.nextActions ?? []).map((action) =>
				resolveNextActionBin(action),
			),
		}));

		this.json({
			ok: false,
			commandId: envelope.commandId,
			error: {
				...envelope.error,
				nextActions: resolvedErrorActions,
			},
			diagnostics: resolvedDiagnostics,
			nextActions: resolvedNextActions,
		});
	}

	cancel(message: string, commandId = "cli") {
		this.reportErrored({
			ok: false,
			commandId,
			error: {
				code: ERROR_CODES.CANCELLED,
				severity: "info",
				summary: sanitizeSecretText(message),
				nextActions: [],
			},
			diagnostics: [],
			nextActions: [],
		});
	}

	fatal(message: string, error?: unknown, commandId = "cli"): never {
		const errorText =
			error instanceof Error
				? error.message
				: error
					? String(error)
					: undefined;

		this.reportErrored({
			ok: false,
			commandId,
			error: {
				code: ERROR_CODES.INTERNAL,
				severity: "error",
				summary: sanitizeSecretText(message),
				...(errorText !== undefined
					? { why: sanitizeSecretText(errorText) }
					: {}),
				...(errorText !== undefined ? { meta: { error: errorText } } : {}),
				nextActions: [],
			},
			diagnostics: [],
			nextActions: [],
		});
		throw error instanceof Error ? error : new Error(message);
	}

	refuse(refusal: Refusal, commandId = "init") {
		const nextActions: NextAction[] =
			refusal.nextActions ??
			(refusal.retryWith?.includes("--force")
				? [
						{
							kind: "run-command",
							label: "Re-run with --force to bypass this check",
							command: `{bin} ${commandId} --force`,
						},
					]
				: []);

		this.reportErrored({
			ok: false,
			commandId,
			error: {
				code: refusal.code,
				severity: "error",
				summary: sanitizeSecretText(refusal.message),
				...(refusal.why ? { why: sanitizeSecretText(refusal.why) } : {}),
				...(refusal.details !== undefined ? { meta: refusal.details } : {}),
				nextActions,
			},
			diagnostics: [],
			nextActions,
		});
	}

	finish(
		message: string,
		details?: Record<string, unknown>,
		commandId = "init",
	) {
		this.reportCompleted({
			ok: true,
			commandId,
			result: {
				message,
				...(details ?? {}),
			},
			exitCode: 0,
			diagnostics: [],
			nextActions: [],
		});
	}

	async flush(): Promise<void> {
		return new Promise((resolve) => {
			process.stdout.write("", () => resolve());
		});
	}
}
