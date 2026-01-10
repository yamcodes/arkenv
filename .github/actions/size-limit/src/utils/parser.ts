import * as fs from "node:fs";
import * as path from "node:path";
import type { SizeLimitResult, SizeLimitState } from "../types.ts";

/**
 * Normalizes package names from Turbo/GHA output.
 */
export const normalizePackageName = (name: string): string => {
	// Remove GHA timestamps if they exist
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

	// Handle "package:size" or "package#size"
	if (normalized.includes(":") || normalized.includes("#")) {
		const parts = normalized.split(/[:#]/);
		normalized = parts[0] ?? normalized;
	}

	return normalized.trim();
};

/**
 * Gets all package names in the monorepo to help with attribution.
 */
export function getPackageNames(): string[] {
	const results: string[] = [];
	try {
		const packagesDir = path.join(process.cwd(), "packages");
		if (!fs.existsSync(packagesDir)) return [];

		const dirents = fs.readdirSync(packagesDir, { withFileTypes: true });
		for (const dirent of dirents) {
			if (dirent.isDirectory()) {
				const pkgPath = path.join(packagesDir, dirent.name, "package.json");
				if (fs.existsSync(pkgPath)) {
					const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
					if (pkg.name) results.push(pkg.name);
				}
			}
		}
	} catch (error) {
		// Silent fail
	}
	return results;
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
		const name = normalizePackageName(pkgName);
		const state = getOrCreateState(name);
		const cleanMessage = message.trim();

		// Look for Size: 2.44 kB
		const sizeMatch = cleanMessage.match(
			/size:\s*([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (sizeMatch?.[1]) {
			state.size = sizeMatch[1];
		}

		// Look for Size limit: 2 kB
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
		// Aggressively strip timestamps (some logs have them, some don't)
		const lineNoTimestamp = cleanLine.replace(
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\s*/,
			"",
		);
		const strippedLine = lineNoTimestamp.replace(/^\s*[|>]\s*/, "").trim();
		if (!strippedLine) continue;

		// 1. Check for Package Header on the line itself (e.g., "arkenv:size: Size: 1.7 kB")
		let lineAttributed = false;
		for (const pkg of relevantPackages) {
			const unscoped = pkg.startsWith("@") ? (pkg.split("/")[1] ?? pkg) : pkg;

			// Match "pkg:size:" or "pkg#size" or "@scope/pkg:size:"
			const prefixes = [pkg, unscoped];
			for (const prefix of prefixes) {
				if (
					strippedLine
						.toLowerCase()
						.startsWith(`${prefix.toLowerCase()}:size`) ||
					strippedLine.toLowerCase().startsWith(`${prefix.toLowerCase()}#size`)
				) {
					const separator = strippedLine.includes(`${prefix}:size`)
						? `${prefix}:size`
						: strippedLine.includes(`${prefix}#size`)
							? `${prefix}#size`
							: strippedLine
										.toLowerCase()
										.includes(`${prefix.toLowerCase()}:size`)
								? strippedLine.substring(0, prefix.length + 5)
								: strippedLine.substring(0, prefix.length + 5);

					const message = strippedLine
						.substring(separator.length)
						.replace(/^[:#\s]*/, "");
					lastPackage = pkg;
					parseMessageLine(pkg, message);
					lineAttributed = true;
					break;
				}
			}
			if (lineAttributed) break;
		}
		if (lineAttributed) continue;

		// 2. Group/Header Detection (sticks until next group or header)
		if (strippedLine.includes("##[group]")) {
			const groupMatch = strippedLine.match(/##\[group\]([^:]+)/i);
			if (groupMatch?.[1]) {
				const pkgName = normalizePackageName(groupMatch[1]);
				lastPackage = pkgName;
				continue;
			}
		}

		const headerMatch = strippedLine.match(
			/^([@a-z0-9/._-]+)\s*[:#]\s*size(?:\s*[:#]\s*(.*))?$/i,
		);
		if (headerMatch) {
			const pkgName = normalizePackageName(headerMatch[1] as string);
			lastPackage = pkgName;
			if (headerMatch[2]) {
				parseMessageLine(pkgName, headerMatch[2]);
			}
			continue;
		}

		// 3. Fallback to lastPackage context
		if (lastPackage) {
			parseMessageLine(lastPackage, strippedLine);
		}

		// Log for debugging (but only if it looks like data)
		if (strippedLine.match(/size:|size\s*limit/i)) {
			process.stdout.write(
				`DEBUG: Attributed size data to ${lastPackage}: "${strippedLine}"\n`,
			);
		}
	}

	const results: SizeLimitResult[] = [];
	for (const [pkgName, state] of packageStates) {
		if (state.size && state.limit) {
			// Ensure we only return packages that are actually relevant (exists in our monorepo)
			const isActuallyRelevant =
				relevantPackages.length === 0 ||
				relevantPackages.some(
					(p) => p === pkgName || pkgName.includes(p.replace(/^@arkenv\//, "")),
				);

			if (isActuallyRelevant) {
				results.push({
					package: pkgName,
					file: state.file || "index.js",
					size: state.size,
					limit: state.limit,
					status: state.status,
				});
			}
		}
	}

	return results;
}
