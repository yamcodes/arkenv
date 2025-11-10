#!/usr/bin/env bun

import { regex } from "arkregex";
import { spawn } from "bun";

interface SizeLimitResult {
	package: string;
	file: string;
	size: string;
	limit: string;
	status: "✅" | "❌";
	diff?: string;
}

type SizeInBytes = number;

// Convert size string (e.g., "711 B", "1.2 kB", "5 MB", "2.5 GiB") to bytes
const parseSizeToBytes = (sizeStr: string): SizeInBytes => {
	// Match number and optional unit (case-insensitive)
	const match = sizeStr.match(/^([0-9.]+)\s*([a-z]*)$/i);
	if (!match || !match[1]) {
		return 0;
	}

	const value = Number.parseFloat(match[1]);
	const unit = match[2]?.toLowerCase() ?? "";

	// Handle bytes (no unit or just 'b')
	if (!unit || unit === "b") {
		return value;
	}

	// Map units to multipliers (using 1024-based)
	const multipliers: Record<string, number> = {
		k: 1024 ** 1,
		kb: 1024 ** 1,
		kib: 1024 ** 1,
		m: 1024 ** 2,
		mb: 1024 ** 2,
		mib: 1024 ** 2,
		g: 1024 ** 3,
		gb: 1024 ** 3,
		gib: 1024 ** 3,
	};

	const multiplier = multipliers[unit];
	if (multiplier === undefined) {
		return 0;
	}

	return value * multiplier;
};

// Calculate percentage difference
const calculateDiff = (current: SizeInBytes, baseline: SizeInBytes): string => {
	if (baseline === 0) {
		return current > 0 ? "+∞%" : "—";
	}
	const diff = ((current - baseline) / baseline) * 100;
	if (Math.abs(diff) < 0.1) {
		return "—";
	}
	const sign = diff > 0 ? "+" : "";
	return `${sign}${diff.toFixed(1)}%`;
};

// Get inputs from environment
const turboToken = process.env.INPUT_TURBO_TOKEN;
const turboTeam = process.env.INPUT_TURBO_TEAM;
const filter = process.env.INPUT_FILTER || "./packages/*";
const baseBranch = process.env.INPUT_BASE_BRANCH || "main";
const isPR = process.env.GITHUB_EVENT_NAME === "pull_request";

// Set Turbo environment variables if provided
if (turboToken) {
	process.env.TURBO_TOKEN = turboToken;
}
if (turboTeam) {
	process.env.TURBO_TEAM = turboTeam;
}

// Function to parse size-limit output
const parseSizeLimitOutput = (
	sizeOutput: string,
	filter: string,
): SizeLimitResult[] => {
	const results: SizeLimitResult[] = [];
	const lines = sizeOutput.split("\n");

	let currentPackage = "";
	let currentFile = "";
	let currentSize = "";
	let currentLimit = "";
	let currentStatus: "✅" | "❌" = "✅";
	let parsingMode: "colon" | "hash" | null = null;

	const normalizePackageName = (pkgName: string) => {
		const cleaned = pkgName.replace(/^[./]+/, "");
		if (cleaned.startsWith("@")) {
			return cleaned;
		}
		if (cleaned.includes("/")) {
			const segments = cleaned.split("/");
			const scopeIndex = segments.findIndex((part) => part.startsWith("@"));
			return scopeIndex >= 0
				? segments.slice(scopeIndex).join("/")
				: (segments.at(-1) ?? cleaned);
		}
		return cleaned;
	};

	const stripAnsiRegex = regex("\x1B\\[[0-?]*[ -/]*[@-~]", "g");
	const controlCharsRegex = regex("[\u0000-\u0008\u000B-\u001F\u007F]", "g");

	const stripAnsi = (text: string) => text.replace(stripAnsiRegex, "");
	const sanitizeLine = (text: string) =>
		stripAnsi(text).replace(controlCharsRegex, "");

	const flushCurrentPackage = () => {
		if (currentPackage && currentSize && currentLimit) {
			const filename = currentFile.split("/").pop() || "bundle";
			results.push({
				package: currentPackage,
				file: filename,
				size: currentSize,
				limit: currentLimit,
				status: currentStatus,
			});
		}
	};

	const startPackage = (pkgName: string) => {
		if (currentPackage === pkgName) {
			return;
		}

		flushCurrentPackage();
		currentPackage = pkgName;
		currentFile = "";
		currentSize = "";
		currentLimit = "";
		currentStatus = "✅";
	};

	const parseMessageLine = (message: string) => {
		if (!message) {
			return;
		}

		const fileMatch = message.match(
			/([^\s]+\.(?:js|ts|jsx|tsx|cjs|mjs|d\.ts))/i,
		);
		if (fileMatch?.[1]) {
			currentFile = fileMatch[1];
		}

		// Match "Size limit: X kB" or "Limit: X kB"
		const limitMatch = message.match(
			/(?:Size\s+limit|Limit):\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (limitMatch?.[1]) {
			currentLimit = limitMatch[1];
		}

		// Match "Size: X kB" or just "X kB" when in context
		const sizeMatch = message.match(
			/(?:Size|Size is):\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (sizeMatch?.[1]) {
			currentSize = sizeMatch[1];
		}

		// Match table format: "package  size  limit" (space-separated)
		const tableMatch = message.match(
			/^([@a-z0-9][@a-z0-9/_-]*)\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (tableMatch?.[1] && tableMatch?.[2] && tableMatch?.[3]) {
			const pkgName = normalizePackageName(tableMatch[1]);
			startPackage(pkgName);
			currentSize = tableMatch[2];
			currentLimit = tableMatch[3];
		}

		// Match direct size-limit output format: "dist/index.js: 1.2 kB (limit: 2 kB)"
		const directMatch = message.match(
			/([^\s]+\.(?:js|ts|jsx|tsx|cjs|mjs|d\.ts)):\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\s*\(limit:\s*([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\)/i,
		);
		if (directMatch?.[1] && directMatch?.[2] && directMatch?.[3]) {
			currentFile = directMatch[1];
			currentSize = directMatch[2];
			currentLimit = directMatch[3];
		}

		// Match format: "X kB of Y kB" or "X kB / Y kB"
		const sizeLimitMatch = message.match(
			/([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\s+(?:of|\/)\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (sizeLimitMatch?.[1] && sizeLimitMatch?.[2]) {
			currentSize = sizeLimitMatch[1];
			currentLimit = sizeLimitMatch[2];
		}

		if (
			message.includes("✖") ||
			message.includes("ERROR") ||
			message.includes("FAIL") ||
			message.toLowerCase().includes("exceeded") ||
			message.includes("❌")
		) {
			currentStatus = "❌";
		}
	};

	for (const line of lines) {
		const strippedLine = sanitizeLine(line);

		// Skip empty lines
		if (!strippedLine.trim()) {
			continue;
		}

		// Match Turbo colon format: "package:size:message"
		const colonMatch = strippedLine.match(
			/^([@a-z0-9][@a-z0-9/_-]*):size:(.*)$/i,
		);
		if (colonMatch?.[1]) {
			parsingMode = "colon";
			const pkgName = normalizePackageName(colonMatch[1]);
			startPackage(pkgName);

			const message = colonMatch[2]?.trim() ?? "";
			parseMessageLine(message);
			continue;
		}

		// Match Turbo hash format: "package#size"
		const hashMatch = strippedLine.match(/^\s*([@a-z0-9][@a-z0-9/_-]*)#size/i);
		if (hashMatch?.[1]) {
			parsingMode = "hash";
			const pkgName = normalizePackageName(hashMatch[1]);
			startPackage(pkgName);
			continue;
		}

		// If we detect a new package in script output, reset parsing mode
		const scriptMatch = strippedLine.match(/>\s*([@a-z0-9][@a-z0-9/_-]*)@\S+/i);
		if (scriptMatch?.[1]) {
			const pkgName = normalizePackageName(scriptMatch[1]);
			// Only start a new package if we're not already in one, or if it's different
			if (!currentPackage || currentPackage !== pkgName) {
				parsingMode = null; // Reset parsing mode for direct output
				startPackage(pkgName);
			}
			continue;
		}

		// Handle indented lines after hash format
		if (parsingMode === "hash" && /^\s+/.test(strippedLine)) {
			parseMessageLine(strippedLine.trim());
			continue;
		}

		// Try to parse direct size-limit output (not wrapped by Turbo)
		// Look for lines that contain size information even without Turbo prefix
		if (strippedLine.match(/[0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB])/i)) {
			// Try to extract package name from context (e.g., "> arkenv@0.7.3 size")
			const pkgContextMatch = strippedLine.match(
				/>\s*([@a-z0-9][@a-z0-9/_-]*)@/i,
			);
			if (pkgContextMatch?.[1]) {
				const pkgName = normalizePackageName(pkgContextMatch[1]);
				startPackage(pkgName);
			} else if (!currentPackage) {
				// If we don't have a current package, try to infer from filter
				// Extract package name from filter pattern like "./packages/arkenv" or "arkenv"
				const filterMatch = filter.match(
					/(?:packages\/)?([@a-z0-9][@a-z0-9/_-]*)/i,
				);
				if (filterMatch?.[1]) {
					const pkgName = normalizePackageName(filterMatch[1]);
					startPackage(pkgName);
				}
			}

			// Parse the line for size information
			parseMessageLine(strippedLine);
		}
	}

	// Add last package if we have data
	flushCurrentPackage();

	return results;
};

// Function to run size-limit and parse results
const runSizeLimit = async (): Promise<{
	results: SizeLimitResult[];
	hasErrors: boolean;
}> => {
	let sizeOutput = "";
	let hasErrors = false;

	try {
		const proc = spawn(["pnpm", "run", "size", "--filter", filter], {
			stdout: "pipe",
			stderr: "pipe",
		});

		const [stdout, stderr] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
		]);

		const exitCode = await proc.exited;
		sizeOutput = stdout + stderr;
		hasErrors = exitCode !== 0;
	} catch (error) {
		sizeOutput = error instanceof Error ? error.message : String(error);
		hasErrors = true;
	}

	const results = parseSizeLimitOutput(sizeOutput, filter);
	return { results, hasErrors };
};

// Function to get baseline sizes from base branch
const getBaselineSizes = async (
	baseBranch: string,
): Promise<Map<string, SizeInBytes>> => {
	const baselineMap = new Map<string, SizeInBytes>();

	if (!isPR) {
		return baselineMap;
	}

	try {
		// Get current branch/commit
		const currentBranchProc = spawn(["git", "rev-parse", "HEAD"], {
			stdout: "pipe",
		});
		const currentCommit = (
			await new Response(currentBranchProc.stdout).text()
		).trim();

		// Check if base branch exists
		const checkBranchProc = spawn(
			["git", "ls-remote", "--heads", "origin", baseBranch],
			{ stdout: "pipe", stderr: "pipe" },
		);
		const checkBranchOutput = await new Response(checkBranchProc.stdout).text();

		if (!checkBranchOutput.trim()) {
			console.log(
				`⚠️ Base branch ${baseBranch} not found, skipping baseline comparison`,
			);
			return baselineMap;
		}

		console.log(`📊 Fetching baseline sizes from ${baseBranch}...`);

		// Fetch the base branch
		const fetchProc = spawn(["git", "fetch", "origin", baseBranch], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const fetchExitCode = await fetchProc.exited;
		if (fetchExitCode !== 0) {
			console.log(
				`⚠️ Failed to fetch ${baseBranch}, skipping baseline comparison`,
			);
			return baselineMap;
		}

		// Checkout base branch temporarily
		const checkoutProc = spawn(["git", "checkout", `origin/${baseBranch}`], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const checkoutExitCode = await checkoutProc.exited;
		if (checkoutExitCode !== 0) {
			console.log(
				`⚠️ Failed to checkout ${baseBranch}, skipping baseline comparison`,
			);
			return baselineMap;
		}

		// Install dependencies and build
		try {
			const installProc = spawn(["pnpm", "install"], {
				stdout: "pipe",
				stderr: "pipe",
			});
			const installExitCode = await installProc.exited;
			if (installExitCode !== 0) {
				console.log(
					`⚠️ Failed to install dependencies on ${baseBranch}, skipping baseline comparison`,
				);
				return baselineMap;
			}

			const buildProc = spawn(["pnpm", "run", "build", "--filter", filter], {
				stdout: "pipe",
				stderr: "pipe",
			});
			const buildExitCode = await buildProc.exited;
			if (buildExitCode !== 0) {
				console.log(
					`⚠️ Failed to build on ${baseBranch}, skipping baseline comparison`,
				);
				return baselineMap;
			}

			// Run size-limit on base branch
			const baselineResult = await runSizeLimit();

			// Create a map of package+file -> size in bytes
			for (const result of baselineResult.results) {
				const key = `${result.package}:${result.file}`;
				const sizeBytes = parseSizeToBytes(result.size);
				baselineMap.set(key, sizeBytes);
			}
		} finally {
			// Checkout back to current commit
			const restoreProc = spawn(["git", "checkout", currentCommit], {
				stdout: "pipe",
				stderr: "pipe",
			});
			await restoreProc.exited;
		}
	} catch (error) {
		console.log(
			`⚠️ Failed to get baseline sizes: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	return baselineMap;
};

// Main execution
console.log("🔍 Running size-limit checks for all packages...");

// Get baseline sizes if in PR context
const baselineSizes = isPR ? await getBaselineSizes(baseBranch) : new Map();

// Reinstall dependencies for current branch after baseline check
// (getBaselineSizes checks out base branch and overwrites node_modules)
if (isPR) {
	console.log("📦 Reinstalling dependencies for current branch...");
	const reinstallProc = spawn(["pnpm", "install"], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const reinstallExitCode = await reinstallProc.exited;
	if (reinstallExitCode !== 0) {
		console.log(
			"⚠️ Failed to reinstall dependencies, size check may be inaccurate",
		);
	}
}

// Run size-limit on current branch
const { results, hasErrors } = await runSizeLimit();

// Calculate diffs and add to results
for (const result of results) {
	const key = `${result.package}:${result.file}`;
	const baselineSize = baselineSizes.get(key);
	if (baselineSize !== undefined) {
		const currentSize = parseSizeToBytes(result.size);
		result.diff = calculateDiff(currentSize, baselineSize);
	} else {
		result.diff = "—";
	}
}

// Create the table
let result: string;
if (results.length === 0) {
	result = "```\nNo results found\n```";
	console.log("⚠️ Could not parse size-limit output");
} else {
	const tableRows = results
		.map(
			(r) =>
				`| \`${r.package}\` | \`${r.file}\` | ${r.size} | ${r.limit} | ${r.diff ?? "—"} | ${r.status} |`,
		)
		.join("\n");
	result = `| Package | File | Size | Limit | Diff | Status |\n|---------|------|------|-------|------|--------|\n${tableRows}`;
}

// Set GitHub outputs
const githubOutput = process.env.GITHUB_OUTPUT;
if (githubOutput) {
	const fs = await import("node:fs/promises");
	const output = `result<<EOF\n${result}\nEOF\nhas_errors=${hasErrors}\n`;
	await fs.appendFile(githubOutput, output);
}

// Print summary
if (hasErrors) {
	console.log("❌ Size limit checks failed");
	process.exit(1);
} else {
	console.log("✅ All size limit checks passed");
}
