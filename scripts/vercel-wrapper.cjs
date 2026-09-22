const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);

if (args.length === 0) {
	console.error("No arguments provided to vercel-wrapper.cjs");
	process.exit(1);
}

/**
 * Whether this invocation is a `vercel build` (not pull/deploy/alias).
 *
 * @param {string[]} argv CLI args after the binary
 * @returns {boolean}
 */
function isBuildCommand(argv) {
	return argv[0] === "build";
}

/**
 * Strip ENABLE_EXPERIMENTAL_COREPACK from pulled Vercel env files so a future
 * dotenv override cannot re-enable Corepack for Nub identity builds.
 *
 * @param {string} cwd Directory that may contain `.vercel/.env.*.local`
 */
function stripCorepackFromPulledEnv(cwd) {
	const vercelDir = path.join(cwd, ".vercel");
	let entries;
	try {
		entries = fs.readdirSync(vercelDir);
	} catch {
		return;
	}
	for (const name of entries) {
		if (!name.startsWith(".env.") || !name.endsWith(".local")) continue;
		const filePath = path.join(vercelDir, name);
		let contents;
		try {
			contents = fs.readFileSync(filePath, "utf8");
		} catch {
			continue;
		}
		const next = contents
			.split(/\r?\n/)
			.filter((line) => {
				const trimmed = line.trim();
				return (
					trimmed !== "ENABLE_EXPERIMENTAL_COREPACK=1" &&
					trimmed !== 'ENABLE_EXPERIMENTAL_COREPACK="1"' &&
					!trimmed.startsWith("ENABLE_EXPERIMENTAL_COREPACK=")
				);
			})
			.join("\n");
		if (next !== contents) {
			try {
				fs.writeFileSync(filePath, next);
			} catch {
				// Env override below still wins; file strip is belt-and-braces.
			}
		}
	}
}

/**
 * Build the child process env for the Vercel CLI.
 *
 * With root `packageManager: "nub@…"`, Corepack rejects `nub` and Vercel does
 * not recognize `nub.lock`. Actions already run `nub install`, so for `build`
 * we disable Corepack and mark install complete so the CLI skips its own
 * install (which would fall back to npm and break `workspace:*`).
 *
 * `VERCEL_INSTALL_COMPLETED` is an internal CLI signal; if a future vercel pin
 * stops honoring it, set the Vercel project Install Command to empty or
 * `nub install` via the dashboard/API.
 *
 * @param {NodeJS.ProcessEnv} baseEnv Parent env (usually `process.env`)
 * @param {string[]} argv CLI args after the binary
 * @param {{ cwd?: string }} [options]
 * @returns {NodeJS.ProcessEnv}
 */
function buildChildEnv(baseEnv, argv, options = {}) {
	const env = { ...baseEnv };
	if (!isBuildCommand(argv)) {
		return env;
	}

	const cwd = options.cwd ?? process.cwd();
	stripCorepackFromPulledEnv(cwd);

	delete env.VERCEL_INSTALL_COMPLETED_PATH;
	env.ENABLE_EXPERIMENTAL_COREPACK = "0";
	env.VERCEL_INSTALL_COMPLETED = "1";
	return env;
}

module.exports = {
	buildChildEnv,
	isBuildCommand,
	stripCorepackFromPulledEnv,
};

if (require.main === module) {
	// Tests set VERCEL_WRAPPER_BIN to a fake CLI. Deploy workflows leave it unset
	// and pin vercel via nubx so they need no global install / GITHUB_PATH dance.
	const overrideBin = process.env.VERCEL_WRAPPER_BIN;
	const childEnv = buildChildEnv(process.env, args);
	const child = overrideBin
		? spawn(overrideBin, args, {
				stdio: ["inherit", "inherit", "pipe"],
				env: childEnv,
			})
		: spawn("nubx", ["-y", "-p", "vercel@59.16.0", "vercel", ...args], {
				stdio: ["inherit", "inherit", "pipe"],
				env: childEnv,
			});

	let stderr = "";

	child.stderr.on("data", (data) => {
		const str = data.toString();
		stderr += str;
		process.stderr.write(data);
	});

	child.on("close", (code) => {
		if (code !== 0) {
			const rateLimitKeywords = [
				"reached its daily deployment limit",
				"RATE_LIMIT_EXCEEDED",
				"Too many requests",
				"Deployment limit reached",
			];

			const isRateLimit = rateLimitKeywords.some((keyword) =>
				stderr.includes(keyword),
			);

			const title = isRateLimit
				? "Vercel Rate Limit Exceeded"
				: "Vercel CLI failed";
			const detail =
				stderr.trim() ||
				(isRateLimit
					? "Your Vercel account has reached a rate limit. See https://vercel.com/docs/platform/limits"
					: `vercel exited with code ${code}`);

			// Workflow command: percent-encode so the annotation stays one line.
			const encoded = detail
				.replace(/%/g, "%25")
				.replace(/\r/g, "")
				.replace(/\n/g, "%0A");
			console.log(`\n::error title=${title}::${encoded}`);

			const summaryPath = process.env.GITHUB_STEP_SUMMARY;
			if (summaryPath) {
				const heading = isRateLimit
					? "Vercel rate limit exceeded"
					: "Vercel CLI failed";
				const md = `\n## ${heading}\n\nExit code \`${code}\`.\n\n\`\`\`\n${detail}\n\`\`\`\n`;
				try {
					fs.appendFileSync(summaryPath, md);
				} catch {
					// Annotation already emitted; keep the original exit code.
				}
			}
		}
		// Don't process.exit(): the runner captures stdout over a pipe, and a hard
		// exit can drop the ::error:: annotation written above before it drains.
		process.exitCode = code ?? 1;
	});
}
