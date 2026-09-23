/**
 * Convert npm / npx command lines to Nub.
 *
 * Nub's install CLI is pnpm-shaped (`nub add`, `nub install`, `nub remove`)
 * and its bin runner is `nubx` (drop-in for `npx` / `pnpm dlx`).
 *
 * @see https://nubjs.com/docs/install
 * @see https://nubjs.com/docs/runner
 */

function parseArgs(command: string): string[] {
	const args: string[] = [];
	let lastQuote: string | false = false;
	let escaped = false;
	let part = "";

	for (const char of command) {
		if (char === "\\") {
			part += char;
			escaped = true;
			continue;
		}
		if (char === " " && !lastQuote) {
			args.push(part);
			part = "";
		} else if (!escaped && (char === '"' || char === "'")) {
			part += char;
			if (char === lastQuote) lastQuote = false;
			else if (!lastQuote) lastQuote = char;
		} else {
			part += char;
		}
		escaped = false;
	}
	args.push(part);
	return args;
}

function convertInstallArgs(args: string[]): string[] {
	return args
		.map((item) => {
			switch (item) {
				case "--save":
				case "-S":
					return "";
				case "--no-package-lock":
					return "--frozen-lockfile";
				default:
					return item;
			}
		})
		.filter(Boolean);
}

/**
 * Convert a single bare npm / npx command (no leading indent, no chain seps).
 *
 * @param command - Trimmed npm-form command.
 * @returns Nub-equivalent command, or the input when it is not npm/npx.
 */
function convertBareNpmCommand(command: string): string {
	if (command.length === 0) return command;

	if (/^npx\b/.test(command)) {
		return command.replace(/^npx\b/, "nubx");
	}

	if (!/^npm\b/.test(command)) {
		return command;
	}

	const withoutNpm = command.replace(/^npm\s+/, "");
	const args = parseArgs(withoutNpm.trim());
	const dashDash = args.findIndex((a) => a === "--");
	if (dashDash >= 0) args.splice(dashDash, 1);

	const verb = args[0];
	if (!verb) return "nub install";

	switch (verb) {
		case "install":
		case "i": {
			const nonFlags = args.filter((item) => !item.startsWith("-"));
			// Same rule as npm-to-yarn's npm→pnpm: packages present → `add`.
			if (args.length > 1 && nonFlags.length > 1) {
				args[0] = "add";
			} else {
				args[0] = "install";
			}
			return `nub ${convertInstallArgs(args).join(" ")}`;
		}
		case "uninstall":
		case "un":
		case "remove":
		case "r":
		case "rm": {
			args[0] = "remove";
			return `nub ${convertInstallArgs(args).join(" ")}`;
		}
		case "run":
		case "exec":
		case "test":
		case "start":
		case "stop":
		case "link":
		case "unlink":
		case "outdated":
		case "pack":
		case "init":
			return `nub ${args.join(" ")}`;
		case "t":
		case "tst":
			args[0] = "test";
			return `nub ${args.join(" ")}`;
		case "ln":
			args[0] = "link";
			return `nub ${args.join(" ")}`;
		default:
			return `npm ${withoutNpm}\n# couldn't auto-convert command`;
	}
}

/**
 * Convert one shell segment, preserving surrounding whitespace.
 *
 * @param segment - Command fragment between `&&` / `;` separators.
 * @returns Converted segment with the same leading/trailing whitespace.
 */
function convertSegment(segment: string): string {
	const leadingWs = segment.match(/^\s*/)?.[0] ?? "";
	const core = segment.slice(leadingWs.length).trimEnd();
	const trailingWs = segment.slice(leadingWs.length + core.length);
	if (core.length === 0) return segment;
	return `${leadingWs}${convertBareNpmCommand(core)}${trailingWs}`;
}

/**
 * Convert a single line, including `&&` / `;` chains (quote-aware), to Nub.
 *
 * Matches fumadocs `remarkNpm` behavior of rewriting `npm`/`npx` anywhere on
 * the line so tabs stay consistent for fences like `cd app && npm install`.
 *
 * @param line - One command line (may have leading whitespace).
 * @returns Nub-equivalent command line.
 */
function convertNpmLineToNub(line: string): string {
	const indent = line.match(/^[ \t]*/)?.[0] ?? "";
	const rest = line.slice(indent.length);
	if (rest.trim().length === 0) return line;

	const pieces: string[] = [];
	let buf = "";
	let inQuote: string | false = false;
	let escaped = false;

	for (let i = 0; i < rest.length; i++) {
		const char = rest[i] ?? "";
		if (escaped) {
			buf += char;
			escaped = false;
			continue;
		}
		if (char === "\\") {
			buf += char;
			escaped = true;
			continue;
		}
		if (inQuote) {
			buf += char;
			if (char === inQuote) inQuote = false;
			continue;
		}
		if (char === '"' || char === "'") {
			inQuote = char;
			buf += char;
			continue;
		}
		if (rest.startsWith("&&", i)) {
			pieces.push(convertSegment(buf), "&&");
			buf = "";
			i += 1; // loop adds 1 more
			continue;
		}
		if (char === ";") {
			pieces.push(convertSegment(buf), ";");
			buf = "";
			continue;
		}
		buf += char;
	}
	pieces.push(convertSegment(buf));
	return `${indent}${pieces.join("")}`;
}

/**
 * Convert an npm / npx command (possibly multi-line) to Nub.
 *
 * @param command - Raw npm-form command from a package-install fence.
 * @returns Nub-form command (`nub add` / `nubx` / …).
 */
export function convertNpmToNub(command: string): string {
	return command.split("\n").map(convertNpmLineToNub).join("\n");
}
