#!/usr/bin/env bun

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
	const proc = spawn(["pnpm", "turbo", "run", "size", "--filter", filter], {
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
		return pkgName.split("/")[1]!;
	}
	return pkgName;
};

// Define regexes via String.raw so we avoid embedding literal control characters.
const stripAnsiRegex = /\x1B[[\](?;]{0,2}(;?\d)*[A-Za-z]/g;
const controlCharsRegex = /[\u0000-\u0008\u000b-\u001f\u007f]/g;

const stripAnsi = (text: string) => text.replace(stripAnsiRegex, "");
const sanitizeLine = (text: string) =>
	stripAnsi(text).replace(controlCharsRegex, "");

const parseMessageLine = (message: string) => {
	if (!message) {
		return;
	}

	const fileMatch = message.match(/([^\s]+\.(?:js|ts|jsx|tsx|cjs|mjs))/i);
	if (fileMatch && fileMatch[1]) {
		currentFile = fileMatch[1];
	}

	const limitMatch = message.match(/Size\s+limit:\s+([0-9.]+\s*[kK]?[bB])/i);
	if (limitMatch && limitMatch[1]) {
		currentLimit = limitMatch[1];
	}

	const sizeMatch = message.match(/Size:\s+([0-9.]+\s*[kK]?[bB])/i);
	if (sizeMatch && sizeMatch[1]) {
		currentSize = sizeMatch[1];
	}

	if (
		message.includes("✖") ||
		message.includes("ERROR") ||
		message.includes("FAIL") ||
		message.toLowerCase().includes("exceeded")
	) {
		currentStatus = "❌";
		hasErrors = true;
	}
};

for (const line of lines) {
	const strippedLine = sanitizeLine(line);
	const colonMatch = strippedLine.match(
		/^([@a-z0-9][@a-z0-9/_-]*):size:(.*)$/i,
	);
	if (colonMatch) {
		parsingMode = "colon";
		const pkgName = normalizePackageName(colonMatch[1]!);
		startPackage(pkgName);

		const message = colonMatch[2]?.trim() ?? "";
		parseMessageLine(message);
		continue;
	}

	const hashMatch = strippedLine.match(/^\s*([@a-z0-9][@a-z0-9/_-]*)#size/i);
	if (hashMatch && hashMatch[1]) {
		parsingMode = "hash";
		const pkgName = normalizePackageName(hashMatch[1]);
		startPackage(pkgName);
		continue;
	}

	if (parsingMode === "hash" && /^\s+/.test(strippedLine)) {
		parseMessageLine(strippedLine.trim());
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
