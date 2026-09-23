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
 * Convert a single npm / npx line to Nub.
 *
 * @param line - One command line (may have leading whitespace).
 * @returns Nub-equivalent command line.
 */
function convertNpmLineToNub(line: string): string {
	const indent = line.match(/^[ \t]*/)?.[0] ?? "";
	const trimmed = line.slice(indent.length).trimEnd();
	if (trimmed.length === 0) return line;

	if (/^npx\b/.test(trimmed)) {
		return `${indent}${trimmed.replace(/^npx\b/, "nubx")}`;
	}

	if (!/^npm\b/.test(trimmed)) {
		return line;
	}

	const withoutNpm = trimmed.replace(/^npm\s+/, "");
	const args = parseArgs(withoutNpm.trim());
	const dashDash = args.findIndex((a) => a === "--");
	if (dashDash >= 0) args.splice(dashDash, 1);

	const verb = args[0];
	if (!verb) return `${indent}nub install`;

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
			return `${indent}nub ${convertInstallArgs(args).join(" ")}`;
		}
		case "uninstall":
		case "un":
		case "remove":
		case "r":
		case "rm": {
			args[0] = "remove";
			return `${indent}nub ${convertInstallArgs(args).join(" ")}`;
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
			return `${indent}nub ${args.join(" ")}`;
		case "t":
		case "tst":
			args[0] = "test";
			return `${indent}nub ${args.join(" ")}`;
		case "ln":
			args[0] = "link";
			return `${indent}nub ${args.join(" ")}`;
		default:
			return `${indent}npm ${withoutNpm}\n# couldn't auto-convert command`;
	}
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
