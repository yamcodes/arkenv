const { spawn } = require("node:child_process");
const fs = require("node:fs");

const args = process.argv.slice(2);

if (args.length === 0) {
	console.error("No arguments provided to vercel-wrapper.cjs");
	process.exit(1);
}

const child = spawn("vercel", args, {
	stdio: ["inherit", "inherit", "pipe"],
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
