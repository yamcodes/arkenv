import { regex } from "arkregex";
import { getFilenameFromConfig } from "../package/names.ts";
import type { SizeLimitResult } from "../types.ts";

// Function to parse size-limit output
export const parseSizeLimitOutput = (
	sizeOutput: string,
	filter: string,
): SizeLimitResult[] => {
	const results: SizeLimitResult[] = [];
	const lines = sizeOutput.split("\n");

	const packageStates = new Map<
		string,
		{
			file: string;
			size: string;
			limit: string;
			status: "✅" | "❌";
		}
	>();

	const getOrCreateState = (pkgName: string) => {
		let state = packageStates.get(pkgName);
		if (!state) {
			state = {
				file: "",
				size: "",
				limit: "",
				status: "✅",
			};
			packageStates.set(pkgName, state);
		}
		return state;
	};

	const stripAnsiRegex = regex("\x1B\\[[0-?]*[ -/]*[@-~]", "g");
	const controlCharsRegex = regex("[\u0000-\u0008\u000B-\u001F\u007F]", "g");

	const stripAnsi = (text: string) => text.replace(stripAnsiRegex, "");
	const sanitizeLine = (text: string) =>
		stripAnsi(text).replace(controlCharsRegex, "");

	const parseMessageLine = (pkgName: string, message: string) => {
		if (!message) {
			return;
		}

		const state = getOrCreateState(pkgName);

		const fileMatch = message.match(
			/([^\s]+\.(?:js|ts|jsx|tsx|cjs|mjs|d\.ts))/i,
		);
		if (fileMatch?.[1]) {
			state.file = fileMatch[1];
		}

		// Match "Size limit: X kB" or "Limit: X kB"
		// also support "size-limit" appearing as the key
		const limitMatch = message.match(
			/(?:Size(?:\s+|-)?limit|Limit)\s*:\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (limitMatch?.[1]) {
			state.limit = limitMatch[1];
		}

		// Match "Size: X kB" or just "X kB" when in context
		const sizeMatch = message.match(
			/(?:Size|Size\s+is)\s*:\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (sizeMatch?.[1]) {
			state.size = sizeMatch[1];
		}

		// Match table format: "package  size  limit" (space-separated)
		const tableMatch = message.match(
			/^([@a-z0-9][@a-z0-9/_-]*)\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (tableMatch?.[1] && tableMatch?.[2] && tableMatch?.[3]) {
			const matchedPkg = normalizePackageName(tableMatch[1]);
			const matchedState = getOrCreateState(matchedPkg);
			matchedState.size = tableMatch[2];
			matchedState.limit = tableMatch[3];
		}

		// Match direct size-limit output format: "dist/index.js: 1.2 kB (limit: 2 kB)"
		const directMatch = message.match(
			/([^\s]+\.(?:js|ts|jsx|tsx|cjs|mjs|d\.ts)):\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\s*\(limit:\s*([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\)/i,
		);
		if (directMatch?.[1] && directMatch?.[2] && directMatch?.[3]) {
			state.file = directMatch[1];
			state.size = directMatch[2];
			state.limit = directMatch[3];
		}

		// Match format: "X kB of Y kB" or "X kB / Y kB"
		const sizeLimitMatch = message.match(
			/([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))\s+(?:of|\/)\s+([0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB]))/i,
		);
		if (sizeLimitMatch?.[1] && sizeLimitMatch?.[2]) {
			state.size = sizeLimitMatch[1];
			state.limit = sizeLimitMatch[2];
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

	let lastPackage = "";

	for (const line of lines) {
		const strippedLine = sanitizeLine(line);

		// Skip empty lines
		if (!strippedLine.trim()) {
			continue;
		}

		// Match Turbo colon format: "package:size:message" or "path (package): size: message"
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

		// If we detect a new package in script output, set as last package
		const scriptMatch = strippedLine.match(/>\s*([@a-z0-9][@a-z0-9/_-]*)@\S+/i);
		if (scriptMatch?.[1]) {
			const pkgName = normalizePackageName(scriptMatch[1]);
			getOrCreateState(pkgName);
			lastPackage = pkgName;
			continue;
		}

		// Handle indented lines (often related to the last mentioned package)
		if (lastPackage && /^\s+/.test(strippedLine)) {
			parseMessageLine(lastPackage, strippedLine.trim());
			continue;
		}

		// Try to parse direct size-limit output without Turbo prefix
		if (strippedLine.match(/[0-9.]+\s*(?:[kKmMgG](?:i)?[bB]|[bB])/i)) {
			const pkgContextMatch = strippedLine.match(
				/>\s*([@a-z0-9][@a-z0-9/_-]*)@/i,
			);
			const filterMatch = filter.match(
				/(?:packages\/)?([@a-z0-9][@a-z0-9/_-]*)/i,
			);
			const pkgNameInFilter = filterMatch?.[1]
				? normalizePackageName(filterMatch[1])
				: "";

			const pkgName =
				pkgContextMatch && pkgContextMatch[1]
					? normalizePackageName(pkgContextMatch[1])
					: lastPackage || pkgNameInFilter;

			if (pkgName) {
				parseMessageLine(pkgName, strippedLine);
			}
		}
	}

	// Finalize results from all tracked package states
	for (const [pkgName, state] of packageStates.entries()) {
		if (state.size && state.limit) {
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

	return results;
};

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
