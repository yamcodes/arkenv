import * as fs from "node:fs";
import * as path from "node:path";
import type { SizeLimitResult, SizeLimitState } from "../types.ts";

/**
 * Normalizes package names from Turbo/GHA output.
 */
export const normalizePackageName = (name: string): string => {
	// Remove timestamps if they exist
	let normalized = name.replace(
		/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\s*/,
		"",
	);

	// Remove Turbo prefixes like "packages/arkenv (arkenv)" -> "arkenv"
	const parenMatch = normalized.match(/\(([^)]+)\)$/);
	if (parenMatch) {
		normalized = parenMatch[1] ?? normalized;
	}

	// Handle "package@version task"
	const taskMatch = normalized.match(/^([^@]+)@\d+\.\d+\.\d+\s+([^:]+)/);
	if (taskMatch) {
		normalized = taskMatch[1] ?? normalized;
	}

	// Handle "package:size"
	if (normalized.includes(":")) {
		const parts = normalized.split(":");
		normalized = parts[0] ?? normalized;
	}

	return normalized.trim();
};

/**
 * Gets all package names in the packages directory.
 */
export function getPackageNames(_filter?: string): string[] {
	const packagesDir = path.join(process.cwd(), "packages");
	if (!fs.existsSync(packagesDir)) return [];

	return fs
		.readdirSync(packagesDir, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => {
			const pkgPath = path.join(packagesDir, dirent.name, "package.json");
			if (fs.existsSync(pkgPath)) {
				const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
				return pkg.name;
			}
			return null;
		})
		.filter((name): name is string => name !== null);
}

/**
 * Parses the raw output of size-limit.
 */
export function parseSizeLimitOutput(
	output: string,
	relevantPackages: string[] = [],
): SizeLimitResult[] {
	const lines = output.split("\n");
	const packageStates = new Map<string, SizeLimitState>();

	const getOrCreateState = (pkgName: string): SizeLimitState => {
		const name = normalizePackageName(pkgName);
		const existing = packageStates.get(name);
		if (existing) return existing;

		const newState: SizeLimitState = {
			package: name,
			status: "✅",
		};
		packageStates.set(name, newState);
		return newState;
	};

	let lastPackage: string | null = null;

	const parseMessageLine = (pkgName: string, message: string) => {
		const state = getOrCreateState(pkgName);
		const cleanMessage = message.trim();

		const sizeMatch = cleanMessage.match(
			/^size:\s*([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (sizeMatch?.[1]) {
			state.size = sizeMatch[1];
		}

		const limitMatch = cleanMessage.match(
			/size\s*limit:\s*([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (limitMatch?.[1]) {
			state.limit = limitMatch[1];
		}

		// Table format
		const tableMatch = cleanMessage.match(
			/^([@a-z0-9/._-]+)\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (tableMatch?.[1] && tableMatch?.[2] && tableMatch?.[3]) {
			const matchedPkg = normalizePackageName(tableMatch[1]);
			const matchedState = getOrCreateState(matchedPkg);
			matchedState.size = tableMatch[2];
			matchedState.limit = tableMatch[3];
		}

		// Direct match
		const directMatch = cleanMessage.match(
			/([^\s]+\.(?:js|ts|jsx|tsx|cjs|mjs|d\.ts)):\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\s*\(limit:\s*([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\)/i,
		);
		if (directMatch?.[1] && directMatch?.[2] && directMatch?.[3]) {
			state.file = directMatch[1];
			state.size = directMatch[2];
			state.limit = directMatch[3];
		}

		if (
			cleanMessage.includes("✖") ||
			cleanMessage.includes("ERROR") ||
			cleanMessage.includes("FAIL") ||
			cleanMessage.toLowerCase().includes("exceeded") ||
			cleanMessage.includes("❌")
		) {
			state.status = "❌";
		}
	};

	const ansiRegex = new RegExp(
		"[\\u001b\\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]",
		"g",
	);

	for (const line of lines) {
		const cleanLine = line.replace(ansiRegex, "");
		const strippedLine = cleanLine.replace(/^\s*[|>]\s*/, "").trim();
		if (!strippedLine) continue;

		if (cleanLine.includes("##[group]")) {
			const groupMatch = cleanLine.match(/##\[group\]([^:]+)/i);
			if (groupMatch?.[1]) {
				const pkgName = normalizePackageName(groupMatch[1]);
				getOrCreateState(pkgName);
				lastPackage = pkgName;
				continue;
			}
		}
		if (cleanLine.includes("##[endgroup]")) {
			lastPackage = null;
			continue;
		}

		const colonHeaderMatch = strippedLine.match(
			/^([@a-z0-9/._-]+)\s*:\s*size(?:\s*:\s*(.*))?$/i,
		);
		const hashHeaderMatch = strippedLine.match(/^([@a-z0-9/._-]+)\s*#\s*size/i);
		const headerMatch = colonHeaderMatch || hashHeaderMatch;

		if (headerMatch) {
			const pkgName = normalizePackageName(headerMatch[1] as string);
			lastPackage = pkgName;
			if (headerMatch[2]) {
				parseMessageLine(pkgName, headerMatch[2]);
			}
			continue;
		}

		if (lastPackage) {
			parseMessageLine(lastPackage, strippedLine);
		}

		if (strippedLine.includes("Size:") || strippedLine.includes("Limit:")) {
			process.stdout.write(
				`DEBUG: Found size-related line: "${strippedLine}" (lastPackage: ${lastPackage})\n`,
			);
		}
	}

	const results: SizeLimitResult[] = [];
	for (const [pkgName, state] of packageStates) {
		if (state.size && state.limit) {
			if (
				relevantPackages.length > 0 &&
				!relevantPackages.some((p) => p === pkgName || pkgName.includes(p))
			) {
				continue;
			}
			results.push({
				package: pkgName,
				file: state.file || "index.js",
				size: state.size,
				limit: state.limit,
				status: state.status,
			});
		}
	}

	return results;
}
