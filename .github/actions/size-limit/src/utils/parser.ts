import * as fs from "node:fs";
import * as path from "node:path";
import { regex } from "arkregex";
import { glob } from "glob";
import type { SizeLimitResult, SizeLimitState } from "../types.ts";
import { formatBytes } from "./size.ts";

/**
 * Reads and parses .size-limit.json files from all packages.
 */
export async function parseJsonFiles(): Promise<SizeLimitResult[]> {
	const results: SizeLimitResult[] = [];
	const files = glob.sync("packages/**/.size-limit.json", {
		ignore: ["**/node_modules/**", "**/.turbo/**"],
	});

	for (const file of files) {
		try {
			const content = fs.readFileSync(file, "utf-8");
			const data = JSON.parse(content);

			const dir = path.dirname(file);
			let pkgName = path.basename(dir);
			try {
				const pkgJsonPath = path.join(dir, "package.json");
				const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
				pkgName = pkgJson.name || pkgName;
			} catch {
				// Fallback to folder name
			}

			if (Array.isArray(data)) {
				for (const item of data) {
					// size-limit --json uses 'size' and 'sizeLimit' as numbers
					const rawSize = item.size;
					const rawLimit = item.sizeLimit ?? item.limit;

					const size =
						typeof rawSize === "number"
							? formatBytes(rawSize)
							: rawSize || "0 B";
					const limit =
						typeof rawLimit === "number"
							? formatBytes(rawLimit)
							: rawLimit || " - ";

					results.push({
						package: pkgName,
						file: item.name || item.path || "index.js",
						size,
						limit,
						status: item.passed !== false ? "✅" : "❌",
					});
				}
			}
		} catch (error) {
			process.stdout.write(`DEBUG: Failed to parse ${file}: ${error}\n`);
		}
	}

	return results;
}

/**
 * Normalizes package names from Turbo/GHA output.
 */
export const normalizePackageName = (name: string): string => {
	let normalized = name.replace(
		/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\s*/,
		"",
	);
	normalized = normalized.replace(/^[○●•✔✖ℹ⚠»>\s]+/, "");

	const parenMatch = normalized.match(/\(([^)]+)\)$/);
	if (parenMatch) {
		normalized = parenMatch[1] ?? normalized;
	}

	const taskMatch = normalized.match(/^([^@\s]+)@\d+\.\d+\.\d+\s+([^:]+)/);
	if (taskMatch) {
		normalized = taskMatch[1] ?? normalized;
	}

	if (normalized.includes(":") || normalized.includes("#")) {
		const parts = normalized.split(/[:#]/);
		normalized = (parts[0] ?? normalized).trim();
	}

	return normalized.trim();
};

/**
 * Gets all package names in the monorepo.
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
	} catch {
		// Silent fail
	}
	return results;
}

/**
 * Parses raw output string for fallback support.
 */
export function parseSizeLimitOutput(
	output: string,
	relevantPackages: string[] = [],
): SizeLimitResult[] {
	const lines = output.split("\n");
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

	const ansiRegex = regex(
		"[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]",
		"g",
	);

	for (const line of lines) {
		const cleanLine = line.replace(ansiRegex, "");
		const lineNoTimestamp = cleanLine.replace(
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\s*/,
			"",
		);
		const strippedLine = lineNoTimestamp.replace(/^[\s|>○●•✔✖ℹ⚠]+/, "").trim();
		if (!strippedLine) continue;

		if (strippedLine.includes("##[group]")) {
			const groupContent = strippedLine.split("##[group]")[1]?.trim();
			if (groupContent) {
				const pkgName = normalizePackageName(groupContent);
				let fullPkg = pkgName;
				for (const rp of relevantPackages) {
					if (rp === pkgName || rp.endsWith(`/${pkgName}`)) {
						fullPkg = rp;
						break;
					}
				}
				lastPackage = fullPkg;
				continue;
			}
		}

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
			continue;
		}

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
						return true;
					}
				}
			}
			return false;
		})();
		if (lineAttributed) continue;

		if (!lastPackage && strippedLine.match(/size:|size\s*limit/i)) {
			for (const pkg of relevantPackages) {
				const unscoped = pkg.startsWith("@") ? (pkg.split("/")[1] ?? pkg) : pkg;
				if (
					strippedLine.toLowerCase().includes(pkg.toLowerCase()) ||
					strippedLine.toLowerCase().includes(unscoped.toLowerCase())
				) {
					lastPackage = pkg;
					break;
				}
			}
		}

		if (lastPackage) {
			parseMessageLine(lastPackage, strippedLine);
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

	return results;
}
