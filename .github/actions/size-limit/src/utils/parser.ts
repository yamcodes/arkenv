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
		if (!packageStates.has(pkgName)) {
			packageStates.set(pkgName, {
				package: pkgName,
				status: "✅",
			});
		}
		return packageStates.get(pkgName)!;
	};

	let lastPackage: string | null = null;

	const parseMessageLine = (pkgName: string, message: string) => {
		const state = getOrCreateState(pkgName);

		// Match table format: "package  size  limit" (space-separated)
		const tableMatch = message.match(
			/^([@a-z0-9/._-]+)\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (tableMatch?.[1] && tableMatch?.[2] && tableMatch?.[3]) {
			const matchedPkg = normalizePackageName(tableMatch[1]);
			const matchedState = getOrCreateState(matchedPkg);
			matchedState.size = tableMatch[2];
			matchedState.limit = tableMatch[3];
		}

		// Match direct output format: "dist/index.js: 1.2 kB (limit: 2 kB)"
		const directMatch = message.match(
			/([^\s]+\.(?:js|ts|jsx|tsx|cjs|mjs|d\.ts)):\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\s*\(limit:\s*([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\)/i,
		);
		if (directMatch?.[1] && directMatch?.[2] && directMatch?.[3]) {
			state.file = directMatch[1];
			state.size = directMatch[2];
			state.limit = directMatch[3];
		}

		// Fallback for interleaved logs
		if (!state.size || !state.limit) {
			const fallbackMatch = message.match(
				/^([@a-z0-9/._-]+)\s+.*?\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\s*\(limit:\s*([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\)/i,
			);
			if (fallbackMatch?.[1] && fallbackMatch?.[2] && fallbackMatch?.[3]) {
				const pkg = normalizePackageName(fallbackMatch[1]);
				const pkgState = getOrCreateState(pkg);
				pkgState.size = fallbackMatch[2];
				pkgState.limit = fallbackMatch[3];
			}
		}

		if (
			message.includes("✖") ||
			message.includes("ERROR") ||
			message.includes("FAIL") ||
			message.toLowerCase().includes("exceeded") ||
			message.includes("❌")
		) {
			state.status = "❌";
		}
	};

	for (const line of lines) {
		const strippedLine = line.replace(/^\s*[|>]\s*/, "").trim();
		if (!strippedLine) continue;

		// Match Turbo colon format: "package:size:message"
		const simpleColonMatch = strippedLine.match(
			/^([@a-z0-9/._-]+)\s*:\s*size\s*:\s*(.*)$/i,
		);
		const parenMatch = strippedLine.match(
			/^[.a-z/-]+\s*\(([@a-z0-9/._-]+)\)\s*:\s*size\s*:\s*(.*)$/i,
		);
		const colonMatch = simpleColonMatch || parenMatch;

		if (colonMatch) {
			const pkgName = normalizePackageName(colonMatch[1] as string);
			const message = (colonMatch[2] || "").trim();
			parseMessageLine(pkgName, message);
			lastPackage = pkgName;
			continue;
		}

		// Match Turbo hash format: "package#size"
		const hashMatch = strippedLine.match(/^\s*([@a-z0-9][@a-z0-9/_-]*)#size/i);
		if (hashMatch?.[1]) {
			const pkgName = normalizePackageName(hashMatch[1]);
			getOrCreateState(pkgName);
			lastPackage = pkgName;
			continue;
		}

		// Fallback to last seen package if the line is indented or looks like size output
		if (lastPackage) {
			parseMessageLine(lastPackage, strippedLine);
		}

		// Debug: log if we see something that looks like it should be parsed
		if (strippedLine.includes("Size:") || strippedLine.includes("Limit:")) {
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
