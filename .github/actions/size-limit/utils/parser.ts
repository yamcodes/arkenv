import { regex } from "arkregex";
import type { SizeLimitResult } from "../types.ts";
import { getFilenameFromConfig } from "./package.ts";

// Function to parse size-limit output
export const parseSizeLimitOutput = (
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
			// Extract filename: if currentFile has a path, use the last part
			// Handle both "dist/index.js" and "index.js" formats
			// If no filename found in output, try to get it from package.json config
			let filename = currentFile
				? (currentFile.includes("/")
						? currentFile.split("/").pop()
						: currentFile) || null
				: null;

			// Fallback to reading from package.json size-limit config
			if (!filename) {
				filename = getFilenameFromConfig(currentPackage);
			}

			// Final fallback to "bundle" if we still can't determine the file
			filename = filename || "bundle";

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
