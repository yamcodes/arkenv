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

	// Remove Turbo status characters from the start
	normalized = normalized.replace(/^[○●•✔✖ℹ⚠»>\s]+/, "");

	// Remove Turbo prefixes like "packages/arkenv (arkenv)" -> "arkenv"
	const parenMatch = normalized.match(/\(([^)]+)\)$/);
	if (parenMatch) {
		normalized = parenMatch[1] ?? normalized;
	}

	// Handle "package@version task"
	const taskMatch = normalized.match(/^([^@\s]+)@\d+\.\d+\.\d+\s+([^:]+)/);
	if (taskMatch) {
		normalized = taskMatch[1] ?? normalized;
	}

	// Handle "package:size" or "package#size"
	if (normalized.includes(":") || normalized.includes("#")) {
		const parts = normalized.split(/[:#]/);
		normalized = (parts[0] ?? normalized).trim();
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
		if (!fs.existsSync(packagesDir)) {
			process.stdout.write(`DEBUG: packages Dir not found at ${packagesDir}\n`);
			return [];
		}

		const dirents = fs.readdirSync(packagesDir, { withFileTypes: true });
		for (const dirent of dirents) {
			if (dirent.isDirectory()) {
				const pkgPath = path.join(packagesDir, dirent.name, "package.json");
				if (fs.existsSync(pkgPath)) {
					const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
					if (pkg.name) results.push(pkg.name);
				} else {
					// Handle scoped packages in subdirectories
					const subDir = path.join(packagesDir, dirent.name);
					const subDirents = fs.readdirSync(subDir, { withFileTypes: true });
					for (const subDirent of subDirents) {
						if (subDirent.isDirectory()) {
							const subPkgPath = path.join(
								subDir,
								subDirent.name,
								"package.json",
							);
							if (fs.existsSync(subPkgPath)) {
								const subPkg = JSON.parse(fs.readFileSync(subPkgPath, "utf-8"));
								if (subPkg.name) results.push(subPkg.name);
							}
						}
					}
				}
			}
		}
	} catch (error) {
		process.stdout.write(`DEBUG: getPackageNames error: ${error}\n`);
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

	process.stdout.write(
		`DEBUG: Starting parse. Relevant packages: [${relevantPackages.join(", ")}]\n`,
	);

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
		const cleanMessage = message.trim();

		const sizeMatch = cleanMessage.match(
			/size:\s*([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
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

		const tableMatch = cleanMessage.match(
			/^([@a-z0-9/._-]+)\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (tableMatch?.[1] && tableMatch?.[2] && tableMatch?.[3]) {
			const matchedPkgName = tableMatch[1] as string;
			// Find actual package name from relevant set
			let actualPkg = normalizePackageName(matchedPkgName);
			for (const rp of relevantPackages) {
				if (rp === actualPkg || rp.endsWith(`/${actualPkg}`)) {
					actualPkg = rp;
					break;
				}
			}
			const matchedState = getOrCreateState(actualPkg);
			matchedState.size = tableMatch[2];
			matchedState.limit = tableMatch[3];
		}

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

	// Use constructor with double backslash to satisfy Biome
	const ansiRegex = new RegExp(
		"[\\u001b\\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]",
		"g",
	);

	for (const line of lines) {
		const cleanLine = line.replace(ansiRegex, "");
		const lineNoTimestamp = cleanLine.replace(
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\s*/,
			"",
		);
		// Remove pipes and status markers more carefully
		const strippedLine = lineNoTimestamp.replace(/^[\s|>○●•✔✖ℹ⚠]+/, "").trim();
		if (!strippedLine) continue;

		// 1. Group Detection (Context is "sticky")
		if (strippedLine.includes("##[group]")) {
			const groupContent = strippedLine.split("##[group]")[1]?.trim();
			if (groupContent) {
				const pkgName = normalizePackageName(groupContent);
				// Map to full name
				let fullPkg = pkgName;
				for (const rp of relevantPackages) {
					if (rp === pkgName || rp.endsWith(`/${pkgName}`)) {
						fullPkg = rp;
						break;
					}
				}
				lastPackage = fullPkg;
				process.stdout.write(
					`DEBUG: Group switch to ${lastPackage} from line "${strippedLine}"\n`,
				);
				continue;
			}
		}

		// 2. Header Detection - Relaxed regex (no ^ anchor)
		const headerMatch = strippedLine.match(
			/([@a-z0-9/._-]+)\s*[:#]\s*size(?:\s*[:#]\s*(.*))?/i,
		);
		if (headerMatch) {
			const pkgPart = headerMatch[1] as string;
			const pkgName = normalizePackageName(pkgPart);
			let fullPkg = pkgName;
			for (const rp of relevantPackages) {
				if (rp === pkgName || rp.endsWith(`/${pkgName}`)) {
					fullPkg = rp;
					break;
				}
			}
			lastPackage = fullPkg;
			if (headerMatch[2]) {
				parseMessageLine(fullPkg, headerMatch[2]);
			}
			process.stdout.write(
				`DEBUG: Header match ${lastPackage} from line "${strippedLine}"\n`,
			);
			continue;
		}

		// 3. Attribution fallback for replayed logs (checks if line starts with pkg: )
		const lineAttributed = (() => {
			for (const pkg of relevantPackages) {
				const unscoped = pkg.startsWith("@") ? (pkg.split("/")[1] ?? pkg) : pkg;
				const prefixes = [pkg, unscoped];
				for (const prefix of prefixes) {
					if (
						strippedLine.toLowerCase().startsWith(`${prefix.toLowerCase()}:`) ||
						strippedLine.toLowerCase().startsWith(`${prefix.toLowerCase()}#`)
					) {
						const message = strippedLine
							.substring(prefix.length + 1)
							.replace(/^[:#\s]*/, "");
						lastPackage = pkg;
						parseMessageLine(pkg, message);
						process.stdout.write(
							`DEBUG: Inline attribution to ${lastPackage} from line "${strippedLine}"\n`,
						);
						return true;
					}
				}
			}
			return false;
		})();
		if (lineAttributed) continue;

		// 4. Final fallback: If we see data but context is null, try to guess from line content
		if (!lastPackage && strippedLine.match(/size:|size\s*limit/i)) {
			for (const pkg of relevantPackages) {
				const unscoped = pkg.startsWith("@") ? (pkg.split("/")[1] ?? pkg) : pkg;
				if (
					strippedLine.toLowerCase().includes(pkg.toLowerCase()) ||
					strippedLine.toLowerCase().includes(unscoped.toLowerCase())
				) {
					lastPackage = pkg;
					process.stdout.write(
						`DEBUG: Guessed context ${lastPackage} from line "${strippedLine}"\n`,
					);
					break;
				}
			}
		}

		// 5. Apply context
		if (lastPackage) {
			parseMessageLine(lastPackage, strippedLine);
		}

		// Log data lines for debugging
		if (strippedLine.match(/size:|size\s*limit/i)) {
			process.stdout.write(
				`DEBUG: Parsed size data. Context: ${lastPackage}. Line: "${strippedLine}"\n`,
			);
		}
	}

	const results: SizeLimitResult[] = [];
	for (const [pkgName, state] of packageStates) {
		if (state.size && state.limit) {
			results.push({
				package: pkgName,
				file: state.file || "index.js",
				size: state.size,
				limit: state.limit,
				status: state.status,
			});
		}
	}

	process.stdout.write(
		`DEBUG: Parse complete. Total results: ${results.length}\n`,
	);
	return results;
}
