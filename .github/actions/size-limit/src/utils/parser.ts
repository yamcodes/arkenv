import { getFilenameFromConfig, getPackageNames } from "../package/names.ts";
import type { SizeLimitResult, SizeLimitState } from "../types.ts";

/**
 * Normalizes a package name for comparison.
 */
const normalizePackageName = (name: string): string => {
	let normalized = name.trim().replace(/^[./]+/, "");

	// Remove Turbo parenthetical paths if present: "packages/arkenv (arkenv)" -> "arkenv"
	const parenMatch = normalized.match(/\(([^)]+)\)$/);
	if (parenMatch) {
		normalized = parenMatch[1] as string;
	}

	// If it's a path like "packages/arkenv", get the folder name
	// (unless it's a scoped package which starts with @)
	if (normalized.includes("/") && !normalized.startsWith("@")) {
		const parts = normalized.split("/");
		normalized = parts[parts.length - 1] as string;
	}

	return normalized;
};

export const parseSizeLimitOutput = (
	sizeOutput: string,
	filter: string,
): SizeLimitResult[] => {
	const relevantPackages = getPackageNames(filter);
	console.log(
		`🔍 Relevant packages for filter "${filter}": ${relevantPackages.join(", ")}`,
	);

	const results: SizeLimitResult[] = [];
	const lines = sizeOutput.split("\n");

	// Map to track the current state of each package's parsing
	const packageStates = new Map<string, SizeLimitState>();

	const getOrCreateState = (pkgName: string): SizeLimitState => {
		const existing = packageStates.get(pkgName);
		if (existing) return existing;

		const newState: SizeLimitState = {
			package: pkgName,
			status: "✅",
		};
		packageStates.set(pkgName, newState);
		return newState;
	};

	let lastPackage: string | null = null;

	const parseMessageLine = (pkgName: string, message: string) => {
		const state = getOrCreateState(pkgName);

		// Handle individual Size/Limit lines (multi-line output)
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

		// Match table format: "package  size  limit" (space-separated)
		const tableMatch = cleanMessage.match(
			/^([@a-z0-9/._-]+)\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (tableMatch?.[1] && tableMatch?.[2] && tableMatch?.[3]) {
			const matchedPkg = normalizePackageName(tableMatch[1]);
			const matchedState = getOrCreateState(matchedPkg);
			matchedState.size = tableMatch[2];
			matchedState.limit = tableMatch[3];
		}

		// Match direct output format: "dist/index.js: 1.2 kB (limit: 2 kB)"
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

	for (const line of lines) {
		// Strip ANSI escape codes first to handle colorized output
		const ansiRegex = new RegExp(
			"[\\u001b\\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]",
			"g",
		);
		const cleanLine = line.replace(ansiRegex, "");
		const strippedLine = cleanLine.replace(/^\s*[|>]\s*/, "").trim();
		if (!strippedLine) continue;

		// Match GitHub Actions grouping (Turbo uses this in CI when it detects GHA)
		// e.g. "##[group]arkenv:size" or "##[group]@repo/types:build"
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

		// Match Turbo header formats: "package:size" or "package#size"
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

		// Fallback to last seen package
		if (lastPackage) {
			parseMessageLine(lastPackage, strippedLine);
		}

		// Debug: log if we see something size-related to verify attribution
		if (strippedLine.includes("Size:") || strippedLine.includes("Limit:")) {
			// biome-ignore lint/suspicious/noConsole: Debug info for CI
			console.log(
				`DEBUG: Found size-related line: "${strippedLine}" (lastPackage: ${lastPackage})`,
			);
		}
	}

	for (const [pkgName, state] of packageStates.entries()) {
		if (state.size && state.limit) {
			// Only include if it matches our filter
			if (relevantPackages.some((p) => p === pkgName || pkgName.includes(p))) {
				let filename = state.file
					? (state.file.includes("/")
							? state.file.split("/").pop()
							: state.file) || null
					: null;

				if (!filename) {
					filename = getFilenameFromConfig(pkgName);
				}

				results.push({
					package: pkgName,
					file: filename || "bundle",
					size: state.size,
					limit: state.limit,
					status: state.status,
				});
			}
		}
	}

	return results;
};
