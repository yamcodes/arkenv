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

/**
 * Best-effort Live Preview payload for the MCP App POC.
 *
 * Composes schema key heuristics, `.env.example` presence, and optional
 * `arkenv check --json` diagnostics. Values are never returned raw.
 *
 * @param cwd Project root
 */
export async function buildPreviewReport(cwd: string): Promise<PreviewReport> {
	const schemaPath = await findFirst(cwd, SCHEMA_CANDIDATES);
	const examplePath = await findFirst(cwd, EXAMPLE_CANDIDATES);

	if (!schemaPath) {
		return {
			schemaPath: null,
			examplePath,
			rows: [],
			note: "No env.ts found. Run the init tool to scaffold ArkEnv, then refresh.",
		};
	}

	const schemaSource = await readFile(path.join(cwd, schemaPath), "utf8");
	const keys = extractSchemaKeys(schemaSource);
	const exampleKeys = examplePath
		? parseExampleKeys(await readFile(path.join(cwd, examplePath), "utf8"))
		: null;

	const checkByKey = await tryCheckDiagnostics(cwd);

	const rows: PreviewRow[] = keys.map((key) => {
		const boundary: PreviewBoundary = hasPublicPrefix(key)
			? "public"
			: "server";
		const inExampleNormalized =
			exampleKeys === null ? null : exampleKeys.has(key);

		const diag = checkByKey.get(key);
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

		if (checkByKey.size > 0) {
			return {
				key,
				boundary,
				inExample: inExampleNormalized,
				status: "ok" as const,
				reason: "Passed check (or not reported as failing)",
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

	return {
		schemaPath,
		examplePath,
		rows,
		...(keys.length === 0
			? {
					note: "Found a schema file but could not extract keys (POC heuristic).",
				}
			: checkByKey.size === 0
				? {
						note: "Pass/fail from arkenv check was unavailable; showing schema + example presence only.",
					}
				: {}),
	};
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

type CheckDiag = { summary: string; received?: string };

async function tryCheckDiagnostics(
	cwd: string,
): Promise<Map<string, CheckDiag>> {
	const map = new Map<string, CheckDiag>();
	try {
		const { command, prefixArgs } = await resolveArkEnvCommand(cwd);
		const args = [...prefixArgs, "check", "--json"];
		const { stdout, exitCode } = await spawnCapture(command, args, cwd);
		if (!stdout.trim()) return map;

		const envelope = JSON.parse(stdout) as {
			diagnostics?: Array<{
				summary?: string;
				meta?: { key?: string; received?: unknown };
			}>;
		};
		for (const d of envelope.diagnostics ?? []) {
			const key = d.meta?.key;
			if (typeof key !== "string" || !key) continue;
			map.set(key, {
				summary: d.summary ?? "Failed check",
				...(d.meta?.received !== undefined
					? { received: String(d.meta.received) }
					: {}),
			});
		}
		void exitCode;
	} catch {
		// check unavailable — leave map empty
	}
	return map;
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
