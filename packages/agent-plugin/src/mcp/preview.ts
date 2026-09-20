import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { hasPublicPrefix } from "../audit/rules";
import { resolveArkEnvCommand } from "./init";

export type PreviewBoundary = "server" | "public" | "unknown";

export type PreviewStatus = "ok" | "fail" | "missing" | "unknown";

export type PreviewRow = {
	key: string;
	boundary: PreviewBoundary;
	inExample: boolean | null;
	status: PreviewStatus;
	reason: string;
	/** Redacted / kind-only hint — never a raw secret. */
	received?: string;
};

export type PreviewReport = {
	schemaPath: string | null;
	examplePath: string | null;
	rows: PreviewRow[];
	/** Absolute project root used for this report (needed for widget refresh). */
	cwd: string;
	/** True when `arkenv check --json` returned a parseable envelope (including empty diagnostics). */
	checkRan?: boolean;
	note?: string;
};

const SCHEMA_CANDIDATES = [
	"env.ts",
	"src/env.ts",
	"app/env.ts",
	"lib/env.ts",
	"src/lib/env.ts",
] as const;

const EXAMPLE_CANDIDATES = [".env.example", ".env.sample"] as const;

type CheckDiag = { summary: string; received?: string };

/** Result of invoking `arkenv check --json` for Live Preview. */
export type CheckOutcome = {
	/** Whether a valid check envelope was parsed (pass or fail). */
	ran: boolean;
	/** Per-key failures from `diagnostics` (empty when check passed). */
	failures: Map<string, CheckDiag>;
};

/**
 * Best-effort Live Preview payload for the MCP App POC.
 *
 * Composes schema key heuristics, `.env.example` presence, and optional
 * `arkenv check --json` diagnostics. Values are never returned raw.
 *
 * @param cwd Project root
 */
export async function buildPreviewReport(cwd: string): Promise<PreviewReport> {
	const resolvedCwd = path.resolve(cwd);
	const schemaPath = await findFirst(resolvedCwd, SCHEMA_CANDIDATES);
	const examplePath = await findFirst(resolvedCwd, EXAMPLE_CANDIDATES);

	if (!schemaPath) {
		return {
			schemaPath: null,
			examplePath,
			rows: [],
			cwd: resolvedCwd,
			note: `No env.ts found under ${resolvedCwd}. Pass cwd to preview (or run from the project root), then refresh.`,
		};
	}

	const schemaSource = await readFile(
		path.join(resolvedCwd, schemaPath),
		"utf8",
	);
	const keys = extractSchemaKeys(schemaSource);
	const exampleKeys = examplePath
		? parseExampleKeys(
				await readFile(path.join(resolvedCwd, examplePath), "utf8"),
			)
		: null;

	const check = await tryCheckDiagnostics(resolvedCwd);
	const rows = buildPreviewRows(keys, exampleKeys, check);

	return {
		schemaPath,
		examplePath,
		rows,
		cwd: resolvedCwd,
		checkRan: check.ran,
		...(keys.length === 0
			? {
					note: "Found a schema file but could not extract keys (POC heuristic).",
				}
			: !check.ran
				? {
						note: "Pass/fail from arkenv check was unavailable; showing schema + example presence only.",
					}
				: {}),
	};
}

/**
 * Map schema keys + example presence + check outcome into board rows.
 *
 * @param keys Schema keys
 * @param exampleKeys Keys from `.env.example`, or null if no example file
 * @param check Outcome from `arkenv check --json`
 */
export function buildPreviewRows(
	keys: string[],
	exampleKeys: Set<string> | null,
	check: CheckOutcome,
): PreviewRow[] {
	return keys.map((key) => {
		const boundary: PreviewBoundary = hasPublicPrefix(key)
			? "public"
			: "server";
		const inExampleNormalized =
			exampleKeys === null ? null : exampleKeys.has(key);

		const diag = check.failures.get(key);
		if (diag) {
			return {
				key,
				boundary,
				inExample: inExampleNormalized,
				status: "fail" as const,
				reason: diag.summary,
				...(diag.received ? { received: redactReceived(diag.received) } : {}),
			};
		}

		if (inExampleNormalized === false) {
			return {
				key,
				boundary,
				inExample: false,
				status: "missing" as const,
				reason: "Declared in schema but missing from .env.example",
			};
		}

		if (check.ran) {
			return {
				key,
				boundary,
				inExample: inExampleNormalized,
				status: "ok" as const,
				reason: "Passed arkenv check",
			};
		}

		return {
			key,
			boundary,
			inExample: inExampleNormalized,
			status: "unknown" as const,
			reason:
				"Schema key detected; run arkenv check for pass/fail (POC heuristic)",
		};
	});
}

async function findFirst(
	cwd: string,
	candidates: readonly string[],
): Promise<string | null> {
	for (const rel of candidates) {
		try {
			await access(path.join(cwd, rel));
			return rel;
		} catch {
			// try next
		}
	}
	return null;
}

/**
 * Rough key extraction for `arkenv({ KEY: ... })` / flat object literals.
 * Not a substitute for schema inspect — POC only.
 */
export function extractSchemaKeys(source: string): string[] {
	const keys: string[] = [];
	const seen = new Set<string>();
	// Line-start or after `{` / `,` — covers both pretty and one-line `arkenv({…})`.
	const re = /(?:^|[{,])\s*(?:["']?)([A-Z][A-Z0-9_]*)(?:["']?)\s*:/gm;
	for (const match of source.matchAll(re)) {
		const key = match[1];
		if (!key || seen.has(key)) continue;
		seen.add(key);
		keys.push(key);
	}
	return keys;
}

function parseExampleKeys(source: string): Set<string> {
	const keys = new Set<string>();
	for (const line of source.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		const key = (eq === -1 ? trimmed : trimmed.slice(0, eq)).trim();
		if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) keys.add(key);
	}
	return keys;
}

/**
 * Parse `arkenv check --json` stdout into a {@link CheckOutcome}.
 *
 * An empty `diagnostics` array with `ok: true` is a successful run — not
 * “check unavailable”.
 *
 * @param stdout Captured CLI stdout
 */
export function parseCheckStdout(stdout: string): CheckOutcome {
	const empty: CheckOutcome = { ran: false, failures: new Map() };
	const trimmed = stdout.trim();
	if (!trimmed) return empty;

	let envelope: {
		ok?: boolean;
		commandId?: string;
		exitCode?: number;
		diagnostics?: Array<{
			summary?: string;
			meta?: { key?: string; received?: unknown };
		}>;
	};
	try {
		envelope = JSON.parse(trimmed) as typeof envelope;
	} catch {
		return empty;
	}

	const looksLikeCheck =
		Array.isArray(envelope.diagnostics) ||
		envelope.commandId === "check" ||
		typeof envelope.ok === "boolean" ||
		typeof envelope.exitCode === "number";
	if (!looksLikeCheck) return empty;

	const failures = new Map<string, CheckDiag>();
	for (const d of envelope.diagnostics ?? []) {
		const key = d.meta?.key;
		if (typeof key !== "string" || !key) continue;
		failures.set(key, {
			summary: d.summary ?? "Failed check",
			...(d.meta?.received !== undefined
				? { received: String(d.meta.received) }
				: {}),
		});
	}
	return { ran: true, failures };
}

async function tryCheckDiagnostics(cwd: string): Promise<CheckOutcome> {
	try {
		const { command, prefixArgs } = await resolveArkEnvCommand(cwd);
		const args = [...prefixArgs, "check", "--json"];
		const { stdout } = await spawnCapture(command, args, cwd);
		return parseCheckStdout(stdout);
	} catch {
		return { ran: false, failures: new Map() };
	}
}

function redactReceived(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return "(empty)";
	if (/^\d+$/.test(trimmed)) return "a number-like string";
	if (/^(true|false)$/i.test(trimmed)) return "a boolean-like string";
	if (/^https?:\/\//i.test(trimmed)) return "[REDACTED URL]";
	if (trimmed.length > 4) return "[REDACTED]";
	return "a string";
}

function spawnCapture(
	command: string,
	args: string[],
	cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (chunk: Buffer | string) => {
			stdout += String(chunk);
		});
		child.stderr.on("data", (chunk: Buffer | string) => {
			stderr += String(chunk);
		});
		child.on("error", reject);
		child.on("close", (code) => {
			resolve({ stdout, stderr, exitCode: code ?? 1 });
		});
	});
}
