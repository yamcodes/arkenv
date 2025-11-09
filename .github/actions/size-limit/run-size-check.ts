#!/usr/bin/env bun

import { regex } from "arkregex";
import { spawn } from "bun";

interface SizeLimitResult {
	package: string;
	file: string;
	size: string;
	limit: string;
	status: "✅" | "❌";
}

// Get inputs from environment
const turboToken = process.env.INPUT_TURBO_TOKEN;
const turboTeam = process.env.INPUT_TURBO_TEAM;
const filter = process.env.INPUT_FILTER || "./packages/*";

// Set Turbo environment variables if provided
if (turboToken) {
	process.env.TURBO_TOKEN = turboToken;
}
if (turboTeam) {
	process.env.TURBO_TEAM = turboTeam;
}

console.log("🔍 Running size-limit checks for all packages...");

// Run turbo size for all packages
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

// Parse the output
const results: SizeLimitResult[] = [];
const lines = sizeOutput.split("\n");

let currentPackage = "";
let currentFile = "";
let currentSize = "";
let currentLimit = "";
let currentStatus: "✅" | "❌" = "✅";
let parsingMode: "colon" | "hash" | null = null;

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

const normalizePackageName = (pkgName: string) => {
	if (pkgName.includes("/")) {
		return pkgName.split("/")[1] ?? pkgName;
	}
	return pkgName;
};

// Matches ESC [ ... <final byte in @-~>
// Ref: ECMA-48
// CSI only
const stripAnsiRegex = regex("\x1B\\[[0-?]*[ -/]*[@-~]", "g");

// Control chars
const controlCharsRegex = regex("[\u0000-\u0008\u000B-\u001F\u007F]", "g");

const stripAnsi = (text: string) => text.replace(stripAnsiRegex, "");
const sanitizeLine = (text: string) =>
	stripAnsi(text).replace(controlCharsRegex, "");

const parseMessageLine = (message: string) => {
	if (!message) {
		return;
	}

	const fileMatch = message.match(/([^\s]+\.(?:js|ts|jsx|tsx|cjs|mjs))/i);
	if (fileMatch?.[1]) {
		currentFile = fileMatch[1];
	}

	// Match "Size limit: X kB" or "Limit: X kB"
	const limitMatch = message.match(
		/(?:Size\s+limit|Limit):\s+([0-9.]+\s*[kK]?[bB])/i,
	);
	if (limitMatch?.[1]) {
		currentLimit = limitMatch[1];
	}

	// Match "Size: X kB" or just "X kB" when in context
	const sizeMatch = message.match(/(?:Size|Size is):\s+([0-9.]+\s*[kK]?[bB])/i);
	if (sizeMatch?.[1]) {
		currentSize = sizeMatch[1];
	}

	// Match table format: "package  size  limit" (space-separated)
	const tableMatch = message.match(
		/^([@a-z0-9][@a-z0-9/_-]*)\s+([0-9.]+\s*[kK]?[bB])\s+([0-9.]+\s*[kK]?[bB])/i,
	);
	if (tableMatch?.[1] && tableMatch?.[2] && tableMatch?.[3]) {
		const pkgName = normalizePackageName(tableMatch[1]);
		startPackage(pkgName);
		currentSize = tableMatch[2];
		currentLimit = tableMatch[3];
	}

	// Match direct size-limit output format: "dist/index.js: 1.2 kB (limit: 2 kB)"
	const directMatch = message.match(
		/([^\s]+\.(?:js|ts|jsx|tsx|cjs|mjs)):\s+([0-9.]+\s*[kK]?[bB])\s*\(limit:\s*([0-9.]+\s*[kK]?[bB])\)/i,
	);
	if (directMatch?.[1] && directMatch?.[2] && directMatch?.[3]) {
		currentFile = directMatch[1];
		currentSize = directMatch[2];
		currentLimit = directMatch[3];
	}

	// Match format: "X kB of Y kB" or "X kB / Y kB"
	const sizeLimitMatch = message.match(
		/([0-9.]+\s*[kK]?[bB])\s+(?:of|\/)\s+([0-9.]+\s*[kK]?[bB])/i,
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
		hasErrors = true;
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
	const scriptMatch = strippedLine.match(
		/>\s*([@a-z0-9][@a-z0-9/_-]*)@[0-9.]+/i,
	);
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
	if (strippedLine.match(/[0-9.]+\s*[kK]?[bB]/)) {
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

// Create the table
let result: string;
if (results.length === 0) {
	result = `\`\`\`\n${sizeOutput}\n\`\`\``;
	console.log("⚠️ Could not parse size-limit output, showing raw output");
} else {
	const tableRows = results
		.map(
			(r) =>
				`| \`${r.package}\` | \`${r.file}\` | ${r.size} | ${r.limit} | ${r.status} |`,
		)
		.join("\n");
	result = `| Package | File | Size | Limit | Status |\n|---------|------|------|-------|--------|\n${tableRows}`;
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
